export interface DiaryEntry {
  id: string;            // crypto.randomUUID()
  createdAt: string;     // ISO 8601
  transcript: string;
  title: string;
  mood: string;
  topics: string[];
  peopleMentioned: string[];
  actionItems: string[];
  keyIdeas: string[];
}
