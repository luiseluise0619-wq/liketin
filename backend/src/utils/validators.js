const Joi = require('joi');

const registerSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string()
    .min(8)
    .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .required(),
  name: Joi.string().min(2).max(50).required(),
  birthDate: Joi.date().iso().required(),
  gender: Joi.string().valid('MALE', 'FEMALE', 'OTHER').required(),
  interestedIn: Joi.string().valid('MALE', 'FEMALE', 'BOTH').required(),
});

const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required(),
});

const profileUpdateSchema = Joi.object({
  bio: Joi.string().max(500).optional(),
  job: Joi.string().max(100).optional(),
  height: Joi.number().integer().min(100).max(250).optional(),
  mbti: Joi.string().length(4).optional(),
  interests: Joi.array().items(Joi.string().max(30)).max(10).optional(),
  location: Joi.object({
    lat: Joi.number().required(),
    lng: Joi.number().required(),
    address: Joi.string().optional(),
  }).optional(),
});

const swipeSchema = Joi.object({
  targetUserId: Joi.string().uuid().required(),
  type: Joi.string().valid('LIKE', 'NOPE', 'SUPER_LIKE').required(),
});

const messageSchema = Joi.object({
  matchId: Joi.string().uuid().required(),
  content: Joi.string().max(1000).required(),
  type: Joi.string()
    .valid('TEXT', 'IMAGE', 'VOICE', 'VIDEO', 'LOCATION', 'EMOJI')
    .default('TEXT'),
  mediaUrl: Joi.string().uri().optional(),
});

const reportSchema = Joi.object({
  reportedId: Joi.string().uuid().required(),
  reason: Joi.string()
    .valid(
      'INAPPROPRIATE_CONTENT',
      'HARASSMENT',
      'FAKE_PROFILE',
      'SPAM',
      'UNDERAGE',
      'OTHER'
    )
    .required(),
  description: Joi.string().max(1000).optional(),
});

module.exports = {
  registerSchema,
  loginSchema,
  profileUpdateSchema,
  swipeSchema,
  messageSchema,
  reportSchema,
};
