declare module 'react-native-view-shot' {
  import { Component } from 'react';

  interface ViewShotProperties {
    options?: {
      format?: 'png' | 'jpg' | 'webm' | 'raw';
      quality?: number;
      result?: 'tmpfile' | 'base64' | 'data-uri' | 'zip-base64';
      width?: number;
      height?: number;
    };
    onCapture?: (uri: string) => void;
    onLoadEnd?: () => void;
  }

  export default class ViewShot extends Component<ViewShotProperties> {
    capture(): Promise<string>;
  }
} 