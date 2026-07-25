const matchService = require('../services/matchService');

class MatchController {
  async getMatches(req, res, next) {
    try {
      const matches = await matchService.getMatches(req.user.id);
      res.json({ matches });
    } catch (error) {
      next(error);
    }
  }

  async unmatch(req, res, next) {
    try {
      const result = await matchService.unmatch(req.user.id, req.params.matchId);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new MatchController();
