import React from 'react';
import { Text, StyleSheet, TextProps } from 'react-native';
import { useTheme } from '../context/ThemeContext';

interface Props extends TextProps {
  text: string;
  highlight: string;
  style?: any;
}

export default function HighlightText({ text, highlight, style, numberOfLines, ...props }: Props) {
  const { theme } = useTheme();

  const styles = StyleSheet.create({
    highlight: {
      backgroundColor: `${theme.accentColor}80`,
      color: theme.isDarkMode ? '#FFFFFF' : theme.textColor,
      borderRadius: 4,
      paddingHorizontal: 4,
      paddingVertical: 2,
      marginHorizontal: -2,
      fontWeight: '700',
    },
  });

  if (!highlight.trim()) {
    return <Text style={style} numberOfLines={numberOfLines} {...props}>{text}</Text>;
  }

  const regex = new RegExp(`(${highlight.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
  const parts = text.split(regex);

  return (
    <Text style={[style]} numberOfLines={numberOfLines} {...props}>
      {parts.map((part, i) => 
        part.toLowerCase() === highlight.toLowerCase() ? (
          <Text key={i} style={[styles.highlight]}>{part}</Text>
        ) : (
          part
        )
      )}
    </Text>
  );
} 