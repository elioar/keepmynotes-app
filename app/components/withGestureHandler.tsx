import React from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

const withGestureHandler = (WrappedComponent: React.ComponentType<any>) => {
  const WithGestureHandler = (props: any) => (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <WrappedComponent {...props} />
    </GestureHandlerRootView>
  );
  return WithGestureHandler;
};

export default withGestureHandler; 