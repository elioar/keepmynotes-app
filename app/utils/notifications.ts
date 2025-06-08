import * as Notifications from 'expo-notifications';

// Ρύθμιση του handler για τις ειδοποιήσεις
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
    severity: Notifications.AndroidNotificationPriority.HIGH
  }),
});

export async function scheduleTaskNotification(
  title: string,
  body: string,
  date: Date,
  identifier: string,
  location?: string,
  isAllDay?: boolean,
  dueTime?: Date
) {
  try {
    console.log('Έναρξη προγραμματισμού ειδοποίησης...');
    console.log('Τίτλος:', title);
    console.log('Ημερομηνία:', date.toLocaleString('el-GR'));

    // Μορφοποίηση της ημερομηνίας και ώρας
    const formattedDate = date.toLocaleDateString('el-GR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
    
    const formattedTime = date.toLocaleTimeString('el-GR', {
      hour: '2-digit',
      minute: '2-digit'
    });

    // Δημιουργία του περιεχομένου της ειδοποίησης
    const notificationContent = {
      title: `📅 ${title}`,
      body: [
        body && `📝 ${body}`,
        `⏰ ${formattedDate}`,
        `🕒 ${formattedTime}`,
        location && `📍 ${location}`,
        isAllDay && '🌞 Ολοήμερο',
      ].filter(Boolean).join('\n\n'),
      sound: true,
      priority: Notifications.AndroidNotificationPriority.HIGH,
      vibrate: [0, 250, 250, 250],
      data: {
        type: 'task',
        taskId: identifier,
        dueDate: date.toISOString(),
        location,
        isAllDay
      },
      android: {
        channelId: 'tasks',
        priority: 'high',
        vibrate: [0, 250, 250, 250],
        color: '#4CAF50',
        smallIcon: 'ic_notification',
        largeIcon: 'ic_notification_large',
        style: {
          type: 'bigText',
          text: body,
          summaryText: `${formattedDate} ${formattedTime}`
        }
      },
      ios: {
        sound: true,
        badge: 1,
        threadId: 'tasks',
        categoryIdentifier: 'TASK_REMINDER',
        interruptionLevel: 'timeSensitive'
      }
    };

    // Έλεγχος αν ο χρόνος έχει ήδη περάσει
    const now = new Date();
    if (date.getTime() <= now.getTime()) {
      console.log('Ο χρόνος ειδοποίησης έχει ήδη περάσει');
      return false;
    }

    // Ακύρωση τυχόν προηγούμενης ειδοποίησης με το ίδιο identifier
    try {
      await Notifications.cancelScheduledNotificationAsync(identifier);
      console.log('Ακυρώθηκε προηγούμενη ειδοποίηση με id:', identifier);
    } catch (error) {
      console.log('Δεν υπήρχε προηγούμενη ειδοποίηση για ακύρωση');
    }

    // Προγραμματισμός της ειδοποίησης
    const scheduledNotification = await Notifications.scheduleNotificationAsync({
      content: notificationContent,
      trigger: {
        type: 'date',
        date: date,
      } as Notifications.DateTriggerInput,
      identifier,
    });

    console.log('Ειδοποίηση προγραμματίστηκε επιτυχώς με id:', scheduledNotification);
    console.log('Θα εμφανιστεί στις:', date.toLocaleString('el-GR'));
    
    return true;
  } catch (error) {
    console.error('Σφάλμα κατά τον προγραμματισμό της ειδοποίησης:', error);
    return false;
  }
}

export async function cancelTaskNotification(identifier: string) {
  try {
    await Notifications.cancelScheduledNotificationAsync(identifier);
    console.log('Η ειδοποίηση ακυρώθηκε επιτυχώς');
    return true;
  } catch (error) {
    console.error('Σφάλμα κατά την ακύρωση της ειδοποίησης:', error);
    return false;
  }
}

export async function requestNotificationPermissions() {
  try {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    console.log('Υπάρχουσα κατάσταση δικαιωμάτων:', existingStatus);
    
    let finalStatus = existingStatus;
    
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
      console.log('Νέα κατάσταση δικαιωμάτων:', status);
    }
    
    return finalStatus === 'granted';
  } catch (error) {
    console.error('Σφάλμα κατά την αίτηση δικαιωμάτων ειδοποιήσεων:', error);
    return false;
  }
}

export function formatNotificationTime(date: Date): string {
  return date.toLocaleString('el-GR', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
} 