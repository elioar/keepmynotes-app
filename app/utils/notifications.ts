import * as Notifications from 'expo-notifications';

export async function scheduleTaskNotification(
  title: string,
  body: string,
  date: Date,
  identifier: string
) {
  await Notifications.scheduleNotificationAsync({
    content: {
      title,
      body,
    },
    trigger: {
      seconds: Math.floor((date.getTime() - Date.now()) / 1000),
    },
    identifier,
  });
}

export async function cancelTaskNotification(identifier: string) {
  await Notifications.cancelScheduledNotificationAsync(identifier);
}

export async function requestNotificationPermissions() {
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;
  
  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }
  
  return finalStatus === 'granted';
} 