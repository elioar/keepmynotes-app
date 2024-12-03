import React from 'react';
import { Text, StyleSheet, TextProps } from 'react-native';

interface Props extends TextProps {
  text: string;
  highlight: string;
  style?: any;
}

function HighlightText({ text, highlight, style, numberOfLines, ...props }: Props) {
  if (!highlight.trim()) {
    return <Text style={style} numberOfLines={numberOfLines} {...props}>{text}</Text>;
  }

  const parts = text.split(new RegExp(`(${highlight})`, 'gi'));

  return (
    <Text style={style} numberOfLines={numberOfLines} {...props}>
      {parts.map((part, i) => 
        part.toLowerCase() === highlight.toLowerCase() ? (
          <Text key={i} style={styles.highlight}>{part}</Text>
        ) : (
          part
        )
      )}
    </Text>
  );
}

const styles = StyleSheet.create({
  highlight: {
    backgroundColor: '#6B4EFF40',
    color: '#6B4EFF',
  },
});

export default HighlightText; 