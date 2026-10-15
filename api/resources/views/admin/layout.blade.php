<!doctype html>
<html lang="pt-BR">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>@yield('title', 'Administração') - InteriorGo</title>
    <style>
        :root{font-family:Inter,system-ui,-apple-system,"Segoe UI",sans-serif;color:#172b25;background:#f3f7f5;font-synthesis:none}
        *{box-sizing:border-box}body{margin:0}a{color:#087a50;text-decoration:none}a:hover{text-decoration:underline}
        .topbar{background:#073f2d;color:#fff;padding:16px max(20px,calc((100% - 1160px)/2));display:flex;align-items:center;justify-content:space-between;gap:20px}
        .brand{font-size:19px;font-weight:800;color:#fff}.top-actions{display:flex;align-items:center;gap:18px}.top-actions a{color:#d8f3e8}
        .logout{border:1px solid #81b9a2;background:transparent;color:#fff;border-radius:8px;padding:9px 13px;cursor:pointer;font:inherit}
        .shell{max-width:1160px;margin:0 auto;padding:28px 20px 56px}.nav{display:flex;gap:10px;flex-wrap:wrap;margin-bottom:24px}
        .nav a{padding:9px 13px;border-radius:8px;background:#e2eee8;font-weight:650}.nav a.active{background:#087a50;color:#fff}
        h1{font-size:28px;margin:0 0 8px}h2{font-size:19px;margin:0 0 14px}.muted{color:#657a72}.intro{margin:0 0 22px}
        .grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(190px,1fr));gap:16px}.card,.panel{background:#fff;border:1px solid #dfe9e4;border-radius:13px;padding:19px;box-shadow:0 3px 12px #1232}
        .metric{font-size:30px;font-weight:800;color:#087a50;margin-top:8px}.panel{margin-top:20px}
        .toolbar{display:flex;justify-content:space-between;align-items:center;gap:12px;flex-wrap:wrap;margin:20px 0}
        .filters,.actions{display:flex;align-items:center;gap:9px;flex-wrap:wrap}input,select,textarea{width:100%;border:1px solid #cbd9d2;border-radius:8px;padding:10px 12px;font:inherit;background:#fff;color:#172b25}
        .filters input{width:min(340px,70vw)}.filters select{width:auto;min-width:145px}
        label{display:block;font-weight:650;margin:14px 0 6px}.button{display:inline-flex;justify-content:center;align-items:center;border:0;border-radius:8px;padding:10px 14px;background:#087a50;color:#fff;font:inherit;font-weight:700;cursor:pointer}
        .button:hover{background:#066340;text-decoration:none}.button.secondary{background:#e2eee8;color:#174b38}.button.danger{background:#a63737}.button.small{padding:7px 10px;font-size:14px}
        .table-wrap{overflow-x:auto}table{width:100%;border-collapse:collapse;min-width:700px}th,td{text-align:left;padding:12px 10px;border-bottom:1px solid #e6eeea;vertical-align:middle}th{font-size:13px;color:#5d7169;text-transform:uppercase;letter-spacing:.04em}
        .badge{display:inline-block;border-radius:99px;background:#e9efec;padding:4px 9px;font-size:13px;font-weight:700}.badge.good{background:#ddf4e7;color:#12643c}.badge.warn{background:#fff1ce;color:#815900}.badge.bad{background:#fde1df;color:#982f29}
        .alert{padding:12px 14px;border-radius:8px;margin:14px 0;background:#ddf4e7;color:#12643c}.errors{background:#fde1df;color:#982f29}
        .form-panel{max-width:720px}.form-actions{display:flex;gap:10px;flex-wrap:wrap;margin-top:20px}.pagination{display:flex;justify-content:center;margin-top:18px}
        .login-page{min-height:100vh;display:grid;place-items:center;padding:20px}.login-card{width:min(430px,100%);background:#fff;border:1px solid #dfe9e4;border-radius:16px;padding:30px;box-shadow:0 12px 40px #1232}.login-card h1{font-size:25px}
        @media(max-width:620px){.topbar{align-items:flex-start}.top-actions{gap:9px;flex-direction:column;align-items:flex-end}.shell{padding:22px 14px 40px}h1{font-size:24px}.card,.panel{padding:15px}}
    </style>
</head>
<body>
@hasSection('login')
    @yield('content')
@else
    <header class="topbar">
        <a class="brand" href="{{ route('admin.dashboard') }}">InteriorGo · Administração</a>
        <div class="top-actions">
            <span>Área restrita · {{ $adminUser->administrador->nivelAcesso }}</span>
            <form method="POST" action="{{ route('admin.logout') }}">@csrf<button class="logout" type="submit">Sair</button></form>
        </div>
    </header>
    <main class="shell">
        <nav class="nav">
            <a class="{{ request()->routeIs('admin.dashboard') ? 'active' : '' }}" href="{{ route('admin.dashboard') }}">Dashboard</a>
            @if ($adminUser->administrador->nivelAcesso === 'Master')
                <a class="{{ request()->routeIs('admin.accounts*') ? 'active' : '' }}" href="{{ route('admin.accounts.index') }}">Contas</a>
            @endif
            <a class="{{ request()->routeIs('admin.events*') ? 'active' : '' }}" href="{{ route('admin.events') }}">Eventos</a>
        </nav>
        @if (session('status'))<div class="alert">{{ session('status') }}</div>@endif
        @if ($errors->any())
            <div class="alert errors"><strong>Revise os dados informados:</strong><ul>@foreach ($errors->all() as $error)<li>{{ $error }}</li>@endforeach</ul></div>
        @endif
        @yield('content')
    </main>
@endif
</body>
</html>
