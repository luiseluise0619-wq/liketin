import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';

import '../../../core/constants/api_constants.dart';
import '../../../core/theme/app_theme.dart';
import '../../../core/utils/api_client.dart';
import '../../bloc/auth/auth_bloc.dart';
import '../../bloc/auth/auth_event.dart';
import 'edit_profile_page.dart';
import 'premium_page.dart';
import 'settings_page.dart';

class ProfilePage extends StatefulWidget {
  const ProfilePage({super.key});

  @override
  State<ProfilePage> createState() => _ProfilePageState();
}

class _ProfilePageState extends State<ProfilePage> {
  Map<String, dynamic>? _profile;
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    try {
      final res = await ApiClient().get(ApiConstants.profile);
      setState(() {
        _profile = res as Map<String, dynamic>;
        _loading = false;
      });
    } catch (_) {
      setState(() => _loading = false);
    }
  }

  List<String> get _photoUrls {
    final raw = (_profile?['photos'] as List?) ?? const [];
    return raw.map((p) => p['url'] as String?).whereType<String>().toList();
  }

  int? get _age {
    final birth = _profile?['birthDate'];
    if (birth == null) return null;
    final d = DateTime.tryParse(birth.toString());
    if (d == null) return null;
    final now = DateTime.now();
    var age = now.year - d.year;
    if (now.month < d.month || (now.month == d.month && now.day < d.day)) age--;
    return age;
  }

  @override
  Widget build(BuildContext context) {
    if (_loading) {
      return const Scaffold(body: Center(child: CircularProgressIndicator()));
    }
    return Scaffold(
      appBar: AppBar(
        title: const Text('Profile'),
        actions: [
          IconButton(
            icon: const Icon(Icons.settings_outlined),
            onPressed: () => Navigator.push(
              context,
              MaterialPageRoute(builder: (_) => const SettingsPage()),
            ),
          ),
        ],
      ),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          _header(),
          const SizedBox(height: 16),
          Row(
            children: [
              Expanded(
                child: OutlinedButton.icon(
                  onPressed: _openEdit,
                  icon: const Icon(Icons.edit_outlined, size: 18),
                  label: const Text('Edit profile'),
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: ElevatedButton.icon(
                  onPressed: () => Navigator.push(
                    context,
                    MaterialPageRoute(builder: (_) => const PremiumPage()),
                  ),
                  icon: const Icon(Icons.workspace_premium, size: 18),
                  label: const Text('Premium'),
                ),
              ),
            ],
          ),
          const SizedBox(height: 20),
          _photoGrid(),
          const SizedBox(height: 24),
          _section('About', _profile?['bio'] as String? ?? 'No bio yet'),
          _infoRow(Icons.work_outline, _profile?['job'] as String? ?? '—'),
          _infoRow(Icons.height, _profile?['height'] != null ? '${_profile!['height']} cm' : '—'),
          _infoRow(Icons.psychology_outlined, _profile?['mbti'] as String? ?? '—'),
          const SizedBox(height: 24),
          _interests(),
          const SizedBox(height: 32),
          OutlinedButton.icon(
            style: OutlinedButton.styleFrom(
              foregroundColor: AppColors.error,
              side: const BorderSide(color: AppColors.error),
              padding: const EdgeInsets.symmetric(vertical: 14),
            ),
            onPressed: _confirmLogout,
            icon: const Icon(Icons.logout),
            label: const Text('Logout'),
          ),
        ],
      ),
    );
  }

  Widget _header() {
    final name = _profile?['name'] as String? ?? '';
    final title = _age != null ? '$name, $_age' : name;
    return Row(
      children: [
        CircleAvatar(
          radius: 36,
          backgroundImage: _photoUrls.isNotEmpty ? CachedNetworkImageProvider(_photoUrls.first) : null,
          child: _photoUrls.isEmpty ? const Icon(Icons.person, size: 36) : null,
        ),
        const SizedBox(width: 16),
        Text(title, style: Theme.of(context).textTheme.headlineSmall),
      ],
    );
  }

  Widget _photoGrid() {
    return GridView.builder(
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
        crossAxisCount: 3,
        crossAxisSpacing: 8,
        mainAxisSpacing: 8,
      ),
      itemCount: 9,
      itemBuilder: (context, i) {
        if (i < _photoUrls.length) {
          return ClipRRect(
            borderRadius: BorderRadius.circular(12),
            child: CachedNetworkImage(imageUrl: _photoUrls[i], fit: BoxFit.cover),
          );
        }
        return Container(
          decoration: BoxDecoration(
            color: Colors.grey.withOpacity(0.15),
            borderRadius: BorderRadius.circular(12),
          ),
          child: const Icon(Icons.add, color: Colors.grey),
        );
      },
    );
  }

  Widget _section(String title, String body) => Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(title, style: Theme.of(context).textTheme.titleLarge),
          const SizedBox(height: 8),
          Text(body, style: Theme.of(context).textTheme.bodyMedium),
          const SizedBox(height: 12),
        ],
      );

  Widget _infoRow(IconData icon, String text) => Padding(
        padding: const EdgeInsets.symmetric(vertical: 4),
        child: Row(children: [
          Icon(icon, size: 20, color: Colors.grey),
          const SizedBox(width: 12),
          Text(text),
        ]),
      );

  Widget _interests() {
    final raw = (_profile?['interests'] as List?) ?? const [];
    final names = raw.map((i) => i['name'] as String?).whereType<String>().toList();
    if (names.isEmpty) return const SizedBox.shrink();
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text('Interests', style: Theme.of(context).textTheme.titleLarge),
        const SizedBox(height: 12),
        Wrap(
          spacing: 8,
          runSpacing: 8,
          children: names
              .map((n) => Chip(
                    label: Text(n),
                    backgroundColor: AppColors.primary.withOpacity(0.1),
                    side: BorderSide.none,
                  ))
              .toList(),
        ),
      ],
    );
  }

  Future<void> _openEdit() async {
    if (_profile == null) return;
    final changed = await Navigator.push<bool>(
      context,
      MaterialPageRoute(builder: (_) => EditProfilePage(profile: _profile!)),
    );
    if (changed == true) _load();
  }

  void _confirmLogout() {
    showDialog(
      context: context,
      builder: (dialogContext) => AlertDialog(
        title: const Text('Logout'),
        content: const Text('Are you sure you want to log out?'),
        actions: [
          TextButton(onPressed: () => Navigator.pop(dialogContext), child: const Text('Cancel')),
          TextButton(
            onPressed: () {
              Navigator.pop(dialogContext);
              context.read<AuthBloc>().add(const LogoutRequested());
            },
            child: const Text('Logout', style: TextStyle(color: AppColors.error)),
          ),
        ],
      ),
    );
  }
}
