
export interface TopicProgress {
  topicId: string;
  mastery: number; // 0 to 1
  lessonsCompleted: string[];
}

export interface StudentProfile {
  name: string;
  level: 'beginner' | 'intermediate' | 'advanced';
  personality: 'coach' | 'scientist' | 'guide';
  progress: TopicProgress[];
  lastActive: string;
  streak: number;
}

const STORAGE_KEY = 'edubridge_profile';

export const studentService = {
  getProfile(): StudentProfile {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) {
      const defaultProfile: StudentProfile = {
        name: 'Student',
        level: 'beginner',
        personality: 'guide',
        progress: [],
        lastActive: new Date().toISOString(),
        streak: 1
      };
      this.saveProfile(defaultProfile);
      return defaultProfile;
    }
    return JSON.parse(stored);
  },

  saveProfile(profile: StudentProfile) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
  },

  updateProgress(topicId: string, lessonId: string) {
    const profile = this.getProfile();
    let topic = profile.progress.find(p => p.topicId === topicId);
    
    if (!topic) {
      topic = { topicId, mastery: 0, lessonsCompleted: [] };
      profile.progress.push(topic);
    }
    
    if (!topic.lessonsCompleted.includes(lessonId)) {
      topic.lessonsCompleted.push(lessonId);
      // Simple mastery calculation: lessons completed / 5 (assuming 5 per topic for now)
      topic.mastery = Math.min(1, topic.lessonsCompleted.length / 5);
    }
    
    profile.lastActive = new Date().toISOString();
    this.saveProfile(profile);
  }
};
