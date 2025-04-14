/**
 * Removes emoji characters from text
 * @param {string} text - Input text containing emojis
 * @returns {string} Text with emojis removed
 */
export const removeEmojis = (text) => {
  return text.replace(
    /[\u{1F600}-\u{1F64F}|\u{1F300}-\u{1F5FF}|\u{1F680}-\u{1F6FF}|\u{2600}-\u{26FF}|\u{2700}-\u{27BF}]/gu,
    ""
  );
};

/**
 * Normalizes text by removing extra whitespace and trimming
 * @param {string} text - Input text to normalize
 * @returns {string} Normalized text
 */
export const normalizeText = (text) => {
  return text
    .replace(/\s+/g, " ") // Replace multiple spaces with single space
    .trim(); // Remove leading and trailing whitespace
};

/**
 * Removes special characters from text
 * @param {string} text - Input text
 * @returns {string} Text with special characters removed
 */
export const removeSpecialCharacters = (text) => {
  return text.replace(/[^a-zA-Z0-9\s]/g, "");
};

/**
 * Converts text to lowercase
 * @param {string} text - Input text
 * @returns {string} Lowercase text
 */
export const toLowerCase = (text) => {
  return text.toLowerCase();
};
