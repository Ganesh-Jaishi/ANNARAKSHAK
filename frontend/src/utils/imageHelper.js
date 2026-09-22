/**
 * Image helper — maps food types to high-quality generated assets and backend uploads.
 */

const KNOWN_FOODS = [
  'rice',
  'dal',
  'biryani',
  'vegetables',
  'bread',
  'curry',
  'paneer',
  'sweets',
  'cooked_meal',
  'salad',
  'fruits',
];

export function getFoodImage(foodType, imagePath) {
  // If backend uploaded image or absolute URL is provided
  if (imagePath) {
    if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
      return imagePath;
    }
    if (imagePath.startsWith('/uploads/')) {
      return `http://localhost:8000${imagePath}`;
    }
    if (imagePath.startsWith('/') || imagePath.startsWith('./')) {
      return imagePath;
    }
    return `http://localhost:8000/uploads/${imagePath}`;
  }

  // Map known food types
  const type = (foodType || '').toLowerCase().trim();

  for (const k of KNOWN_FOODS) {
    if (type.includes(k)) {
      return `/images/food/${k}.jpg`;
    }
  }

  // Aliases and sub-categories
  if (type.includes('thali') || type.includes('dosa') || type.includes('sambar') || type.includes('meal')) {
    return '/images/food/cooked_meal.jpg';
  }
  if (type.includes('roti') || type.includes('naan') || type.includes('chapati') || type.includes('paratha')) {
    return '/images/food/bread.jpg';
  }
  if (type.includes('sabzi') || type.includes('curry') || type.includes('gravy')) {
    return '/images/food/vegetables.jpg';
  }
  if (type.includes('tikka') || type.includes('cheese') || type.includes('dairy')) {
    return '/images/food/paneer.jpg';
  }
  if (type.includes('mithai') || type.includes('dessert') || type.includes('halwa')) {
    return '/images/food/sweets.jpg';
  }

  return '/images/food/cooked_meal.jpg';
}
