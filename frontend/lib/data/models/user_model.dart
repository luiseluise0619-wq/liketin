class UserModel {
  final String id;
  final String name;
  final int? age;
  final String? bio;
  final String? job;
  final int? height;
  final String? mbti;
  final int? distance;
  final List<String> photos;
  final List<String> interests;
  final bool isOnline;

  UserModel({
    required this.id,
    required this.name,
    this.age,
    this.bio,
    this.job,
    this.height,
    this.mbti,
    this.distance,
    this.photos = const [],
    this.interests = const [],
    this.isOnline = false,
  });

  factory UserModel.fromJson(Map<String, dynamic> json) {
    return UserModel(
      id: json['id'] as String,
      name: json['name'] as String? ?? '',
      age: json['age'] as int?,
      bio: json['bio'] as String?,
      job: json['job'] as String?,
      height: json['height'] as int?,
      mbti: json['mbti'] as String?,
      distance: json['distance'] as int?,
      photos: _photoUrls(json['photos']),
      interests: _interestNames(json['interests']),
      isOnline: json['isOnline'] as bool? ?? false,
    );
  }

  static List<String> _photoUrls(dynamic raw) {
    if (raw is! List) return const [];
    return raw
        .map((p) => p is Map ? (p['url'] as String?) : (p as String?))
        .whereType<String>()
        .toList();
  }

  static List<String> _interestNames(dynamic raw) {
    if (raw is! List) return const [];
    return raw
        .map((i) => i is Map ? (i['name'] as String?) : (i as String?))
        .whereType<String>()
        .toList();
  }

  String get mainPhoto => photos.isNotEmpty ? photos.first : '';
}
