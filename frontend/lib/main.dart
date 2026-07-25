import 'package:flutter/material.dart';

import 'core/theme/app_theme.dart';

void main() {
  WidgetsFlutterBinding.ensureInitialized();
  runApp(const LiketinApp());
}

class LiketinApp extends StatelessWidget {
  const LiketinApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'liketin',
      debugShowCheckedModeBanner: false,
      theme: AppTheme.lightTheme(),
      darkTheme: AppTheme.darkTheme(),
      themeMode: ThemeMode.system,
      home: const _Placeholder(),
    );
  }
}

/// Minimal entry screen. Full screens (splash, login, swipe, chat, profile)
/// are documented in frontend/README.md and wired via flutter_bloc.
class _Placeholder extends StatelessWidget {
  const _Placeholder();

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Container(
        decoration: const BoxDecoration(gradient: AppColors.primaryGradient),
        child: const Center(
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(Icons.favorite, size: 80, color: Colors.white),
              SizedBox(height: 16),
              Text(
                'liketin',
                style: TextStyle(
                  color: Colors.white,
                  fontSize: 32,
                  fontWeight: FontWeight.bold,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
