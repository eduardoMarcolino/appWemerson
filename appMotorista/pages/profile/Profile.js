import React, { useState } from 'react';
import { Alert, Image, Text } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { profilePhotoUrl, updateStoredSession, uploadProfilePhoto } from '../api';
import { Avatar, Button, Card, Page, s } from '../ui';

export default function Profile({ go, session, setSession, onLogout }) {
  const [error, setError] = useState('');
  const [uploading, setUploading] = useState(false);

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
    <Page title="Perfil" go={go} nav="Profile">
      <Card style={{ backgroundColor: '#075c3e', flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        {session.user?.fotoPerfil
          ? <Image source={{ uri: profilePhotoUrl(session.user.fotoPerfil) }} style={{ width: 48, height: 48, borderRadius: 24 }} />
          : <Avatar initials={session.user?.nome?.slice(0, 2).toUpperCase() || 'MO'} />}
        <Text style={{ color: '#fff', fontSize: 17, fontWeight: '900', flex: 1 }}>
          {session.user?.nome || 'Motorista'}{' \n'}
          <Text style={{ color: '#d7efe3', fontSize: 12, fontWeight: '400' }}>
            {session.user?.email || ''}
          </Text>
        </Text>
        <Text style={{ color: '#fff' }}>★ {session.motorista?.avaliacaoMedia ?? '—'}</Text>
      </Card>
      {error ? <Text style={{ color: '#d94b45' }}>{error}</Text> : null}
      <Button light disabled={uploading} onPress={() => changePhoto('camera')}>
        {uploading ? 'Enviando foto...' : 'Tirar foto'}
      </Button>
      <Button light disabled={uploading} onPress={() => changePhoto('library')}>Escolher da galeria</Button>
      <Card><Text style={{ fontWeight: '700' }}>CNH: {session.motorista?.cnh || 'Não informada'}</Text></Card>
      <Card><Text style={{ fontWeight: '700' }}>Status: {session.motorista?.statusMotorista || 'Indisponível'}</Text></Card>
      <Button light onPress={() => go('Account')}>Editar ou desativar minha conta</Button>
      <Button danger onPress={onLogout}>Sair da conta</Button>
    </Page>
  );
}
