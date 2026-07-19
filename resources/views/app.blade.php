<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">

        <title inertia>{{ config('app.name', 'PCC-EDMS') }}</title>

        {{-- Fonts are self-hosted from public/fonts via @font-face in
             resources/css/app.css — no external font CDN (docs/DESIGN.md). --}}

        <!-- Prevent sidebar FOUC by setting CSS variable before React loads -->
        <script>
            (function() {
                try {
                    const saved = localStorage.getItem('sidebarCompact');
                    const isCompact = saved && JSON.parse(saved);
                    document.documentElement.style.setProperty('--sidebar-width', isCompact ? '72px' : '296px');
                } catch (e) {
                    document.documentElement.style.setProperty('--sidebar-width', '296px');
                }
            })();
        </script>

        <!-- Scripts -->
        @routes
        @viteReactRefresh
        @vite(['resources/js/app.jsx', "resources/js/Pages/{$page['component']}.jsx"])
        @inertiaHead
    </head>
    <body class="font-sans antialiased">
        @inertia
    </body>
</html>
