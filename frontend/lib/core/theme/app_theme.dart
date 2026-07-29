import 'package:flutter/material.dart';

/// Cute, soft palette — warm coral + pastel lavender/mint accents, cream
/// backgrounds, rounded everything. Designed to feel friendly and playful.
class AppColors {
  static const Color primary = Color(0xFFFF6B8A); // soft coral rose
  static const Color primaryDark = Color(0xFFF25478);
  static const Color primaryLight = Color(0xFFFFA6BC);

  static const Color lavender = Color(0xFFC4B5FD);
  static const Color mint = Color(0xFF7EE0C3);
  static const Color peach = Color(0xFFFFC7A8);
  static const Color sunny = Color(0xFFFFD86E);
  static const Color accent = mint;

  static const Color background = Color(0xFFFFF5F7); // warm cream-pink
  static const Color backgroundDark = Color(0xFF1B1620);
  static const Color surface = Colors.white;
  static const Color surfaceDark = Color(0xFF272029);

  static const Color textPrimary = Color(0xFF4A424C);
  static const Color textSecondary = Color(0xFF9B8F9E);
  static const Color textPrimaryDark = Color(0xFFF0E9F2);
  static const Color textSecondaryDark = Color(0xFFB6A9BC);

  static const Color success = Color(0xFF5FD0A6);
  static const Color warning = Color(0xFFFFC24B);
  static const Color error = Color(0xFFFF7A90);

  static const LinearGradient primaryGradient = LinearGradient(
    colors: [Color(0xFFFF8AA8), Color(0xFFFF6B8A)],
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
  );

  // Soft dreamy gradient for splash / hero areas.
  static const LinearGradient dreamGradient = LinearGradient(
    colors: [Color(0xFFFFB5C8), Color(0xFFC4B5FD)],
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
  );
}

class AppTheme {
  static const double _radius = 24;

  static InputDecorationTheme _inputTheme(Color fill) => InputDecorationTheme(
        filled: true,
        fillColor: fill,
        floatingLabelStyle: const TextStyle(color: AppColors.primary),
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(_radius),
          borderSide: BorderSide.none,
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(_radius),
          borderSide: BorderSide.none,
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(_radius),
          borderSide: const BorderSide(color: AppColors.primary, width: 2),
        ),
        contentPadding: const EdgeInsets.symmetric(horizontal: 20, vertical: 18),
      );

  static ElevatedButtonThemeData get _buttonTheme => ElevatedButtonThemeData(
        style: ElevatedButton.styleFrom(
          backgroundColor: AppColors.primary,
          foregroundColor: Colors.white,
          elevation: 3,
          shadowColor: AppColors.primary.withValues(alpha: 0.4),
          padding: const EdgeInsets.symmetric(horizontal: 32, vertical: 16),
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(30)),
          textStyle: const TextStyle(fontSize: 16, fontWeight: FontWeight.w700),
        ),
      );

  static ChipThemeData get _chipTheme => ChipThemeData(
        backgroundColor: AppColors.primary.withValues(alpha: 0.10),
        labelStyle: const TextStyle(color: AppColors.primaryDark, fontWeight: FontWeight.w600),
        side: BorderSide.none,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
      );

  static ThemeData lightTheme() => ThemeData(
        useMaterial3: true,
        brightness: Brightness.light,
        primaryColor: AppColors.primary,
        scaffoldBackgroundColor: AppColors.background,
        colorScheme: const ColorScheme.light(
          primary: AppColors.primary,
          secondary: AppColors.lavender,
          tertiary: AppColors.mint,
          surface: AppColors.surface,
          error: AppColors.error,
        ),
        inputDecorationTheme: _inputTheme(const Color(0xFFFDECF1)),
        elevatedButtonTheme: _buttonTheme,
        chipTheme: _chipTheme,
        cardTheme: CardThemeData(
          elevation: 6,
          shadowColor: AppColors.primary.withValues(alpha: 0.15),
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(_radius)),
        ),
        appBarTheme: const AppBarTheme(
          elevation: 0,
          centerTitle: true,
          backgroundColor: Colors.transparent,
          foregroundColor: AppColors.textPrimary,
          titleTextStyle: TextStyle(
            color: AppColors.textPrimary,
            fontSize: 20,
            fontWeight: FontWeight.w800,
          ),
        ),
        navigationBarTheme: NavigationBarThemeData(
          backgroundColor: Colors.white,
          indicatorColor: AppColors.primary.withValues(alpha: 0.14),
          elevation: 8,
          labelTextStyle: WidgetStatePropertyAll(
            TextStyle(fontSize: 11, fontWeight: FontWeight.w700, color: AppColors.textSecondary),
          ),
        ),
      );

  static ThemeData darkTheme() => ThemeData(
        useMaterial3: true,
        brightness: Brightness.dark,
        primaryColor: AppColors.primary,
        scaffoldBackgroundColor: AppColors.backgroundDark,
        colorScheme: const ColorScheme.dark(
          primary: AppColors.primary,
          secondary: AppColors.lavender,
          tertiary: AppColors.mint,
          surface: AppColors.surfaceDark,
          error: AppColors.error,
        ),
        inputDecorationTheme: _inputTheme(const Color(0xFF342B38)),
        elevatedButtonTheme: _buttonTheme,
        chipTheme: _chipTheme,
        cardTheme: CardThemeData(
          elevation: 6,
          color: AppColors.surfaceDark,
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(_radius)),
        ),
        appBarTheme: const AppBarTheme(
          elevation: 0,
          centerTitle: true,
          backgroundColor: Colors.transparent,
          foregroundColor: AppColors.textPrimaryDark,
          titleTextStyle: TextStyle(
            color: AppColors.textPrimaryDark,
            fontSize: 20,
            fontWeight: FontWeight.w800,
          ),
        ),
        navigationBarTheme: NavigationBarThemeData(
          backgroundColor: AppColors.surfaceDark,
          indicatorColor: AppColors.primary.withValues(alpha: 0.24),
          elevation: 8,
          labelTextStyle: WidgetStatePropertyAll(
            TextStyle(fontSize: 11, fontWeight: FontWeight.w700, color: AppColors.textSecondaryDark),
          ),
        ),
      );
}
