import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";
import HomeScreen from "./screens/HomeScreen";
import VideoScreen from "./screens/VideoScreen";
import GifScreen from "./screens/GifScreen";
import { RootStackParamList } from "./types/navigation";

const Stack = createStackNavigator<RootStackParamList>();

const App: React.FC = () => {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Home">
        <Stack.Screen name="Home" component={HomeScreen} />
        <Stack.Screen name="Video" component={VideoScreen} />
        <Stack.Screen name="GIF" component={GifScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default App;