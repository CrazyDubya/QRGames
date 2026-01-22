/**
 * Input validation utilities
 */

const MAX_PLAYER_NAME_LENGTH = 30;
const LOBBY_ID_REGEX = /^[a-f0-9]{8}$/;
const AVATAR_REGEX = /^data:image\/(jpeg|jpg|png|gif|webp);base64,/;

/**
 * Validates lobby ID format
 * @param {string} lobbyId - The lobby ID to validate
 * @returns {boolean} True if valid
 */
function validateLobbyId(lobbyId) {
  return lobbyId && typeof lobbyId === 'string' && LOBBY_ID_REGEX.test(lobbyId);
}

/**
 * Sanitizes player name by trimming, limiting length, and removing control characters
 * @param {string} name - The player name to sanitize
 * @returns {string} Sanitized name
 */
function sanitizePlayerName(name) {
  if (!name || typeof name !== 'string') {
    return '';
  }
  return (
    name
      .trim()
      .substring(0, MAX_PLAYER_NAME_LENGTH)
      // eslint-disable-next-line no-control-regex -- Intentionally removing control characters
      .replace(/[\x00-\x1F\x7F]/g, '')
  );
}

/**
 * Validates and sanitizes avatar data URL
 * @param {string} avatar - The avatar data URL
 * @returns {string|null} Sanitized avatar or null if invalid
 */
function validateAvatar(avatar) {
  if (!avatar || typeof avatar !== 'string') {
    return null;
  }
  if (AVATAR_REGEX.test(avatar)) {
    return avatar;
  }
  return null;
}

/**
 * Validates player data
 * @param {object} player - Player data to validate
 * @returns {{valid: boolean, error?: string, sanitized?: object}} Validation result
 */
function validatePlayerData(player) {
  if (!player || typeof player.name !== 'string' || player.name.trim().length === 0) {
    return { valid: false, error: 'Invalid player name' };
  }

  const sanitizedName = sanitizePlayerName(player.name);
  if (sanitizedName.length === 0) {
    return { valid: false, error: 'Player name is required' };
  }

  const sanitizedAvatar = validateAvatar(player.avatar);

  return {
    valid: true,
    sanitized: {
      name: sanitizedName,
      avatar: sanitizedAvatar,
    },
  };
}

module.exports = {
  MAX_PLAYER_NAME_LENGTH,
  LOBBY_ID_REGEX,
  validateLobbyId,
  sanitizePlayerName,
  validateAvatar,
  validatePlayerData,
};
