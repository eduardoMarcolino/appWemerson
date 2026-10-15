import React, { useEffect, useState } from 'react';
import { Alert, Image, Pressable, Text, View } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { api, profilePhotoUrl, updateStoredSession, uploadProfilePhoto } from '../api';
import { Button, Card, Nav, Page, s } from '../ui';

export default function Profile({ go, session, setSession, onLogout }) {
  const [profile, setProfile] = useState(null);
  const [error, setError] = useState('');
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    api.get('/app-data')
      .then(({ data }) => setProfile(data.perfil))
      .catch((requestError) => setError(requestError.message));
  }, []);

  async function changePhoto(source) {
    setError('');
    try {
      if (source === 'camera') {
        const permission = await ImagePicker.requestCameraPermissionsAsync();
        if (!permission.granted) {
          Alert.alert('Permissão necessária', 'Autorize o acesso à câmera para tirar uma foto.');
          return;
        }
      } else {
        const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (!permission.granted) {
          Alert.alert('Permissão necessária', 'Autorize o acesso às fotos para escolher uma imagem.');
          return;
        }
      }

      const options = { mediaTypes: ['images'], allowsEditing: true, aspect: [1, 1], quality: 0.8 };
      const result = source === 'camera'
        ? await ImagePicker.launchCameraAsync(options)
        : await ImagePicker.launchImageLibraryAsync(options);
      if (result.canceled || !result.assets?.[0]) return;

      setUploading(true);
      const response = await uploadProfilePhoto(result.assets[0]);
      const nextSession = { ...session, user: { ...session.user, ...response.user } };
      setSession(nextSession);
      await updateStoredSession(nextSession);
    } catch (requestError) {
      setError(requestError.message || 'Não foi possível atualizar a foto de perfil.');
    } finally {
      setUploading(false);
    }
  }

  return (
    <View style={{ flex: 1 }}>
      <Page title="Perfil" go={go}>
        <Card style={{ backgroundColor: '#075c3e', alignItems: 'center' }}>
          {session.user?.fotoPerfil ? (
            <Image source={{ uri: profilePhotoUrl(session.user.fotoPerfil) }} style={{ width: 104, height: 104, borderRadius: 52 }} />
          ) : (
            <View style={{ width: 104, height: 104, borderRadius: 52, backgroundColor: '#d7efe3', alignItems: 'center', justifyContent: 'center' }}>
              <Text style={{ color: '#075c3e', fontSize: 32, fontWeight: '800' }}>
                {session.user?.nome?.slice(0, 1).toUpperCase() || 'P'}
              </Text>
            </View>
          )}
          <Text style={{ color: '#fff', fontWeight: '800', fontSize: 18 }}>
            {session.user?.nome || 'Passageiro'}
          </Text>
          <Text style={{ color: '#d7efe3' }}>{session.user?.email || ''}</Text>
          <Button light disabled={uploading} onPress={() => changePhoto('camera')}>
            {uploading ? 'Enviando foto...' : 'Tirar foto'}
          </Button>
          <Button light disabled={uploading} onPress={() => changePhoto('library')}>Escolher da galeria</Button>
        </Card>
        {(profile?.telefones || []).map((phone) => (
          <Card key={phone.telefoneId}><Text>Telefone: {phone.numeroTelefone}</Text></Card>
        ))}
        {(profile?.enderecos || []).map((address) => (
          <Card key={address.enderecoId}>
            <Text>{address.logradouro}{address.numero ? `, ${address.numero}` : ''}</Text>
            <Text style={s.muted}>{[address.bairro, address.cidade, address.estado].filter(Boolean).join(' · ')}</Text>
          </Card>
        ))}
        {error ? <Text style={{ color: '#d94b45' }}>{error}</Text> : null}
        <Button light onPress={() => go('Account')}>Editar ou desativar minha conta</Button>
        <Button onPress={() => go('Favorites')}>Endereços e motoristas favoritos</Button>
        <Button light onPress={() => go('Wallet')}>Ver pagamentos</Button>
        <Pressable onPress={onLogout}>
          <Text style={{ color: '#d22b2b', fontWeight: '700', padding: 10 }}>Sair da conta</Text>
        </Pressable>
      </Page>
      <Nav go={go} active="Profile" />
    </View>
  );
}
