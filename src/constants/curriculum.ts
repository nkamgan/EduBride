export interface Lesson {
  id: string;
  title: string;
  description: string;
  keyPoints: string[];
}

export interface SubTopic {
  id: string;
  title: string;
  lessons: Lesson[];
}

export interface Topic {
  id: string;
  title: string;
  icon: string;
  color: string;
  subTopics: SubTopic[];
}

export const STEM_CURRICULUM: Topic[] = [
  {
    id: 'math',
    title: 'Mathematics',
    icon: 'Calculator',
    color: 'bg-blue-500',
    subTopics: [
      {
        id: 'algebra',
        title: 'Algebra',
        lessons: [
          {
            id: 'linear-equations',
            title: 'Linear Equations',
            description: 'Solving equations of the form $ax + b = c$',
            keyPoints: ['Isolation of variables', 'Balancing equations', 'Real-world modeling']
          },
          {
            id: 'quadratic-equations',
            title: 'Quadratic Equations',
            description: 'Solving equations with $x^2$ terms',
            keyPoints: ['Quadratic formula', 'Factoring', 'Completing the square']
          }
        ]
      },
      {
        id: 'geometry',
        title: 'Geometry',
        lessons: [
          {
            id: 'pythagorean-theorem',
            title: 'Pythagorean Theorem',
            description: 'Relationship between sides of a right triangle',
            keyPoints: ['$a^2 + b^2 = c^2$', 'Hypotenuse identification', 'Distance formula']
          }
        ]
      }
    ]
  },
  {
    id: 'physics',
    title: 'Physics',
    icon: 'Zap',
    color: 'bg-amber-500',
    subTopics: [
      {
        id: 'mechanics',
        title: 'Mechanics',
        lessons: [
          {
            id: 'newtons-laws',
            title: 'Newton\'s Laws',
            description: 'The fundamental principles of motion',
            keyPoints: ['Inertia', '$F = ma$', 'Action-Reaction']
          },
          {
            id: 'kinematics',
            title: 'Kinematics',
            description: 'Describing motion with speed, velocity, and acceleration',
            keyPoints: ['Distance vs Displacement', 'Acceleration formulas', 'Projectile motion']
          }
        ]
      }
    ]
  },
  {
    id: 'chemistry',
    title: 'Chemistry',
    icon: 'Beaker',
    color: 'bg-emerald-500',
    subTopics: [
      {
        id: 'atomic-structure',
        title: 'Atomic Structure',
        lessons: [
          {
            id: 'periodic-table',
            title: 'The Periodic Table',
            description: 'Understanding the organization of elements',
            keyPoints: ['Atomic number', 'Groups and Periods', 'Valence electrons']
          }
        ]
      }
    ]
  }
];
