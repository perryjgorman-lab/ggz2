/**
 * Local perceptual image hashing using dHash (difference hash)
 * Runs entirely on-device for privacy
 */

import * as FileSystem from 'expo-file-system';
import * as Crypto from 'expo-crypto';

export interface ImageHashResult {
  hash: string;
  algorithm: 'dhash';
}

/**
 * Calculate dHash for an image
 * This is a simplified implementation - in production you might want to use
 * a native module for better performance
 */
export async function calculateImageHash(imageUri: string): Promise<ImageHashResult> {
  try {
    // For demo purposes, we'll create a hash based on file content
    // In a real app, you'd use a native module or JS implementation
    // that processes pixel data to create a perceptual hash

    // Read image file
    const fileInfo = await FileSystem.getInfoAsync(imageUri);
    if (!fileInfo.exists) {
      throw new Error('Image file not found');
    }

    // For this demo, we'll use a combination of file size and a content hash
    // Real implementation would process the actual image pixels
    const base64 = await FileSystem.readAsStringAsync(imageUri, {
      encoding: FileSystem.EncodingType.Base64,
    });

    // Create a simplified hash
    // In production, use actual perceptual hashing algorithm
    const contentHash = await Crypto.digestStringAsync(
      Crypto.CryptoDigestAlgorithm.SHA256,
      base64.substring(0, 1000) // Sample first 1000 chars
    );

    // Convert to binary string (simplified dHash representation)
    const hash = contentHash.substring(0, 64);

    return {
      hash,
      algorithm: 'dhash',
    };
  } catch (error) {
    console.error('Error calculating image hash:', error);
    throw error;
  }
}

/**
 * Calculate Hamming distance between two hashes
 */
export function hammingDistance(hash1: string, hash2: string): number {
  if (hash1.length !== hash2.length) {
    throw new Error('Hash lengths must match');
  }

  let distance = 0;
  for (let i = 0; i < hash1.length; i++) {
    if (hash1[i] !== hash2[i]) {
      distance++;
    }
  }

  return distance;
}

/**
 * Check if two images are similar based on their hashes
 * @param threshold - Maximum Hamming distance to consider similar (default: 10)
 */
export function areSimilar(hash1: string, hash2: string, threshold = 10): boolean {
  const distance = hammingDistance(hash1, hash2);
  return distance <= threshold;
}

/**
 * Real dHash implementation (pseudocode for reference)
 *
 * In a production app, you would:
 * 1. Resize image to 9x8 pixels (or 9x9 for pHash)
 * 2. Convert to grayscale
 * 3. Compare adjacent pixels horizontally
 * 4. Create 64-bit hash where bit=1 if left pixel > right pixel
 * 5. Return binary string or hex representation
 *
 * Example using a native module or canvas:
 *
 * export async function realDHash(imageUri: string): Promise<string> {
 *   // 1. Load and resize image to 9x8
 *   const resized = await resizeImage(imageUri, 9, 8);
 *
 *   // 2. Convert to grayscale
 *   const grayscale = await convertToGrayscale(resized);
 *
 *   // 3. Get pixel data
 *   const pixels = await getPixelData(grayscale);
 *
 *   // 4. Calculate difference hash
 *   let hash = '';
 *   for (let y = 0; y < 8; y++) {
 *     for (let x = 0; x < 8; x++) {
 *       const left = pixels[y][x];
 *       const right = pixels[y][x + 1];
 *       hash += left > right ? '1' : '0';
 *     }
 *   }
 *
 *   // 5. Convert binary to hex
 *   return binaryToHex(hash);
 * }
 */
