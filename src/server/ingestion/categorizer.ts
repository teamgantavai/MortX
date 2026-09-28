import { ArticleCategory } from './types';

const CATEGORY_RULES: { category: ArticleCategory; regex: RegExp }[] = [
  {
    category: 'TRAFFIC',
    regex: /\b(?:traffic|diversion|road\s+closure|flyover|highway|jam|congestion|detour|potholes?|bus\s+route|route\s+diverted|signals?)\b/i,
  },
  {
    category: 'CRIME',
    regex: /\b(?:arrested|police|theft|robbery|scam|fraud|fir|booked|seized|contraband|raid|court|custody|smuggling|extortion)\b/i,
  },
  {
    category: 'GOVERNMENT',
    regex: /\b(?:municipal\s+corporation|deputy\s+commissioner|administration|cabinet|minister|scheme|policy|subsid(?:y|ies)|notification|civic\s+body|elections?|govt|government)\b/i,
  },
  {
    category: 'EDUCATION',
    regex: /\b(?:school|college|university|ptu|gndu|admissions?|exams?|students?|syllabus|cutoff|degree|scholarship|board\s+results?)\b/i,
  },
  {
    category: 'EVENT',
    regex: /\b(?:festival|celebration|concert|exhibition|fair|mela|food\s+fest|tournament|marathon|match|championship)\b/i,
  },
  {
    category: 'NEWS',
    regex: /\b(?:hospital|weather|rain|monsoon|power\s+cut|electricity|inaugurated|water\s+supply|cleanliness\s+drive|infrastructure|development)\b/i,
  },
];

export class ArticleCategorizer {
  public categorize(title: string, description: string = '', rawCategories?: string[]): ArticleCategory {
    const text = `${title} ${description}`.toLowerCase();

    // Check raw categories from feed if available
    if (rawCategories && rawCategories.length > 0) {
      for (const cat of rawCategories) {
        const lowerCat = cat.toLowerCase();
        for (const rule of CATEGORY_RULES) {
          if (rule.regex.test(lowerCat)) {
            return rule.category;
          }
        }
      }
    }

    // Match text against defined category rules
    for (const rule of CATEGORY_RULES) {
      if (rule.regex.test(text)) {
        return rule.category;
      }
    }

    // If title has generic news wording, return OTHER
    return 'OTHER';
  }
}

export const articleCategorizer = new ArticleCategorizer();
