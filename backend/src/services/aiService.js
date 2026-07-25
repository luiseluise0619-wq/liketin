const logger = require('../utils/logger');

// Lightweight AI service. In production wire these to Google Vision / Gemini
// or a custom model. The implementations here are deterministic, dependency-free
// placeholders so the rest of the app is testable without external keys.
class AIService {
  async analyzePhotoQuality(_imageBuffer) {
    try {
      // Placeholder: return a neutral-high score. Replace with real analysis.
      return 0.75;
    } catch (error) {
      logger.error('Photo analysis error:', error);
      return 0.5;
    }
  }

  async generateProfileRecommendations(_userId, candidates) {
    return [...candidates].sort(
      (a, b) => (b.interests?.length || 0) - (a.interests?.length || 0)
    );
  }

  async suggestIcebreaker(matchContext) {
    const interest = matchContext?.interests?.[0]?.name;
    if (interest) return `Hey! I noticed you're into ${interest} — tell me more! 👋`;
    return 'Hey! Nice to match with you! 👋';
  }

  async moderateContent(text) {
    const flagged = ['scam', 'bitcoin investment', 'wire transfer'];
    const lower = text.toLowerCase();
    const isInappropriate = flagged.some((w) => lower.includes(w));
    return {
      appropriate: !isInappropriate,
      reason: isInappropriate ? 'Contains flagged content' : null,
    };
  }
}

module.exports = new AIService();
