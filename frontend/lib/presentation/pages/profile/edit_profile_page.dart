import 'dart:io';

import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';

import '../../../core/constants/api_constants.dart';
import '../../../core/utils/api_client.dart';
import '../../widgets/custom_button.dart';
import '../../widgets/custom_text_field.dart';

class EditProfilePage extends StatefulWidget {
  final Map<String, dynamic> profile;
  const EditProfilePage({super.key, required this.profile});

  @override
  State<EditProfilePage> createState() => _EditProfilePageState();
}

class _EditProfilePageState extends State<EditProfilePage> {
  final _bio = TextEditingController();
  final _job = TextEditingController();
  final _height = TextEditingController();
  final _mbti = TextEditingController();
  final _interests = TextEditingController();
  final _picker = ImagePicker();

  bool _saving = false;
  List<String> _photoUrls = [];

  @override
  void initState() {
    super.initState();
    final p = widget.profile;
    _bio.text = p['bio'] as String? ?? '';
    _job.text = p['job'] as String? ?? '';
    _height.text = p['height'] != null ? '${p['height']}' : '';
    _mbti.text = p['mbti'] as String? ?? '';
    final interests = (p['interests'] as List?) ?? const [];
    _interests.text =
        interests.map((i) => i['name'] as String?).whereType<String>().join(', ');
    _photoUrls = ((p['photos'] as List?) ?? const [])
        .map((e) => e['url'] as String?)
        .whereType<String>()
        .toList();
  }

  @override
  void dispose() {
    _bio.dispose();
    _job.dispose();
    _height.dispose();
    _mbti.dispose();
    _interests.dispose();
    super.dispose();
  }

  Future<void> _addPhotos() async {
    final picked = await _picker.pickMultiImage();
    if (picked.isEmpty) return;
    try {
      final res = await ApiClient().uploadFiles(
        ApiConstants.photos,
        picked.map((x) => File(x.path)).toList(),
        field: 'photos',
      );
      final uploaded = ((res['photos'] as List?) ?? const [])
          .map((e) => e['url'] as String?)
          .whereType<String>();
      setState(() => _photoUrls = [..._photoUrls, ...uploaded]);
    } catch (e) {
      _snack(e.toString().replaceFirst('Exception: ', ''));
    }
  }

  Future<void> _save() async {
    setState(() => _saving = true);
    final body = <String, dynamic>{
      'bio': _bio.text.trim(),
      'job': _job.text.trim(),
      'mbti': _mbti.text.trim().toUpperCase(),
      'interests': _interests.text
          .split(',')
          .map((s) => s.trim())
          .where((s) => s.isNotEmpty)
          .toList(),
    };
    final h = int.tryParse(_height.text.trim());
    if (h != null) body['height'] = h;

    try {
      await ApiClient().put(ApiConstants.profile, body: body);
      if (mounted) Navigator.pop(context, true);
    } catch (e) {
      _snack(e.toString().replaceFirst('Exception: ', ''));
    } finally {
      if (mounted) setState(() => _saving = false);
    }
  }

  void _snack(String msg) =>
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(msg)));

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Edit Profile')),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          _photoGrid(),
          const SizedBox(height: 24),
          CustomTextField(controller: _bio, label: 'Bio'),
          const SizedBox(height: 16),
          CustomTextField(controller: _job, label: 'Job'),
          const SizedBox(height: 16),
          CustomTextField(
            controller: _height,
            label: 'Height (cm)',
            keyboardType: TextInputType.number,
          ),
          const SizedBox(height: 16),
          CustomTextField(controller: _mbti, label: 'MBTI (e.g. ENFP)'),
          const SizedBox(height: 16),
          CustomTextField(
            controller: _interests,
            label: 'Interests (comma separated)',
          ),
          const SizedBox(height: 28),
          CustomButton(onPressed: _save, loading: _saving, child: const Text('Save')),
        ],
      ),
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
        return GestureDetector(
          onTap: _addPhotos,
          child: Container(
            decoration: BoxDecoration(
              color: Colors.grey.withOpacity(0.15),
              borderRadius: BorderRadius.circular(12),
            ),
            child: const Icon(Icons.add_a_photo_outlined, color: Colors.grey),
          ),
        );
      },
    );
  }
}
