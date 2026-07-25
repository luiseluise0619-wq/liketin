import 'package:flutter/material.dart';

/// Central color palette. Tinder-like red primary with a teal accent.
class AppColors {
  static const Color primary = Color(0xFFFF4458);
  static const Color primaryDark = Color(0xFFE03A4C);
  static const Color primaryLight = Color(0xFFFF6B7A);
  static const Color secondary = Color(0xFF2B2B2B);
  static const Color accent = Color(0xFF00D4AA);

  static const Color background = Color(0xFFF5F5F5);
  static const Color backgroundDark = Color(0xFF121212);
  static const Color surface = Colors.white;
  static const Color surfaceDark = Color(0xFF1E1E1E);

  static const Color textPrimary = Color(0xFF212121);
  static const Color textSecondary = Color(0xFF757575);
  static const Color textPrimaryDark = Color(0xFFE0E0E0);
  static const Color textSecondaryDark = Color(0xFF9E9E9E);

  static const Color success = Color(0xFF4CAF50);
  static const Color warning = Color(0xFFFFA726);
  static const Color error = Color(0xFFE53935);

  static const LinearGradient primaryGradient = LinearGradient(
    colors: [Color(0xFFFF4458), Color(0xFFFF6B7A)],
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
  );
}

class AppTheme {
  static InputDecorationTheme _inputTheme(Color fill) => InputDecorationTheme(
        filled: true,
        fillColor: fill,
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: BorderSide.none,
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: const BorderSide(color: AppColors.primary, width: 2),
        ),
        contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
      );

  static ElevatedButtonThemeData get _buttonTheme => ElevatedButtonThemeData(
        style: ElevatedButton.styleFrom(
          backgroundColor: AppColors.primary,
          foregroundColor: Colors.white,
          elevation: 0,
          padding: const EdgeInsets.symmetric(horizontal: 32, vertical: 16),
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(30)),
          textStyle: const TextStyle(fontSize: 16, fontWeight: FontWeight.w600),
        ),
      );

  static ThemeData lightTheme() => ThemeData(
        useMaterial3: true,
        brightness: Brightness.light,
        primaryColor: AppColors.primary,
        scaffoldBackgroundColor: AppColors.background,
        colorScheme: const ColorScheme.light(
          primary: AppColors.primary,
          secondary: AppColors.accent,
          surface: AppColors.surface,
          error: AppColors.error,
        ),
        inputDecorationTheme: _inputTheme(const Color(0xFFF0F0F0)),
        elevatedButtonTheme: _buttonTheme,
        appBarTheme: const AppBarTheme(elevation: 0, centerTitle: true),
      );

  static ThemeData darkTheme() => ThemeData(
        useMaterial3: true,
        brightness: Brightness.dark,
        primaryColor: AppColors.primary,
        scaffoldBackgroundColor: AppColors.backgroundDark,
        colorScheme: const ColorScheme.dark(
          primary: AppColors.primary,
          secondary: AppColors.accent,
          surface: AppColors.surfaceDark,
          error: AppColors.error,
        ),
        inputDecorationTheme: _inputTheme(const Color(0xFF2C2C2C)),
        elevatedButtonTheme: _buttonTheme,
        appBarTheme: const AppBarTheme(elevation: 0, centerTitle: true),
      );
}
