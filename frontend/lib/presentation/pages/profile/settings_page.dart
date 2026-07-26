import 'package:flutter/material.dart';

import '../../../core/constants/api_constants.dart';
import '../../../core/utils/api_client.dart';

class SettingsPage extends StatefulWidget {
  const SettingsPage({super.key});

  @override
  State<SettingsPage> createState() => _SettingsPageState();
}

class _SettingsPageState extends State<SettingsPage> {
  Map<String, dynamic> _settings = {};
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    try {
      final res = await ApiClient().get(ApiConstants.settings);
      setState(() {
        _settings = (res as Map<String, dynamic>?) ?? {};
        _loading = false;
      });
    } catch (_) {
      setState(() => _loading = false);
    }
  }

  Future<void> _patch(String key, dynamic value) async {
    setState(() => _settings[key] = value);
    try {
      await ApiClient().put(ApiConstants.settings, body: {key: value});
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(e.toString().replaceFirst('Exception: ', ''))),
        );
      }
    }
  }

  int _int(String key, int fallback) => (_settings[key] as num?)?.toInt() ?? fallback;
  bool _bool(String key, bool fallback) => _settings[key] as bool? ?? fallback;

  @override
  Widget build(BuildContext context) {
    if (_loading) {
      return const Scaffold(body: Center(child: CircularProgressIndicator()));
    }
    final minAge = _int('minAge', 18);
    final maxAge = _int('maxAge', 50);
    final maxDistance = _int('maxDistance', 50);

    return Scaffold(
      appBar: AppBar(title: const Text('Settings')),
      body: ListView(
        children: [
          _sectionTitle('Discovery'),
          ListTile(
            title: const Text('Age range'),
            subtitle: Text('$minAge – $maxAge'),
          ),
          RangeSlider(
            min: 18,
            max: 80,
            divisions: 62,
            values: RangeValues(minAge.toDouble(), maxAge.toDouble()),
            labels: RangeLabels('$minAge', '$maxAge'),
            onChanged: (v) => setState(() {
              _settings['minAge'] = v.start.round();
              _settings['maxAge'] = v.end.round();
            }),
            onChangeEnd: (v) {
              _patch('minAge', v.start.round());
              _patch('maxAge', v.end.round());
            },
          ),
          ListTile(
            title: const Text('Maximum distance'),
            subtitle: Text('$maxDistance km'),
          ),
          Slider(
            min: 1,
            max: 150,
            divisions: 149,
            value: maxDistance.toDouble(),
            label: '$maxDistance km',
            onChanged: (v) => setState(() => _settings['maxDistance'] = v.round()),
            onChangeEnd: (v) => _patch('maxDistance', v.round()),
          ),
          SwitchListTile(
            title: const Text('Show me on Discover'),
            value: _bool('showMe', true),
            onChanged: (v) => _patch('showMe', v),
          ),
          const Divider(),
          _sectionTitle('Notifications'),
          SwitchListTile(
            title: const Text('New matches'),
            value: _bool('matchNotifications', true),
            onChanged: (v) => _patch('matchNotifications', v),
          ),
          SwitchListTile(
            title: const Text('Messages'),
            value: _bool('messageNotifications', true),
            onChanged: (v) => _patch('messageNotifications', v),
          ),
          SwitchListTile(
            title: const Text('Likes'),
            value: _bool('likeNotifications', true),
            onChanged: (v) => _patch('likeNotifications', v),
          ),
          const Divider(),
          _sectionTitle('Privacy'),
          SwitchListTile(
            title: const Text('Incognito mode'),
            value: _bool('incognitoMode', false),
            onChanged: (v) => _patch('incognitoMode', v),
          ),
        ],
      ),
    );
  }

  Widget _sectionTitle(String text) => Padding(
        padding: const EdgeInsets.fromLTRB(16, 16, 16, 8),
        child: Text(
          text.toUpperCase(),
          style: TextStyle(
            color: Theme.of(context).colorScheme.primary,
            fontWeight: FontWeight.bold,
            fontSize: 12,
            letterSpacing: 0.5,
          ),
        ),
      );
}
