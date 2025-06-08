export interface TaskDetails {
  id?: string;
  title: string;
  description?: string;
  dueDate: Date;
  dueTime?: Date | null;
  location?: string;
  priority: 'low' | 'medium' | 'high';
  reminder: boolean;
  reminderTime?: '1hour' | '1day' | '1week';
  isAllDay?: boolean;
  completed?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
} 