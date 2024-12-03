import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import HomeScreen from './HomeScreen';
import AddEditNoteScreen from './AddEditNoteScreen';

const Stack = createNativeStackNavigator();

export default function Index() {
  return (
    <Stack.Navigator 
      initialRouteName="Home"
      screenOptions={{
        headerShown: false
      }}
    >
      <Stack.Screen name="Home" component={HomeScreen} />
      <Stack.Screen name="AddEditNote" component={AddEditNoteScreen as any} />
    </Stack.Navigator>
  );
}
