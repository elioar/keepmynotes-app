import React from 'react';
import { Text, StyleSheet } from 'react-native';

interface FormattedTextProps {
  text: string;
}

const FormattedText = ({ text }: FormattedTextProps) => {
  const renderFormattedText = () => {
    let formattedText = text;
    const styles: any[] = [defaultStyles.text];

    // Bold
    if (formattedText.includes('**')) {
      styles.push(defaultStyles.bold);
      formattedText = formattedText.replace(/\*\*(.*?)\*\*/g, '$1');
    }

    // Italic
    if (formattedText.includes('_')) {
      styles.push(defaultStyles.italic);
      formattedText = formattedText.replace(/_(.*?)_/g, '$1');
    }

    // Underline
    if (formattedText.includes('~')) {
      styles.push(defaultStyles.underline);
      formattedText = formattedText.replace(/~(.*?)~/g, '$1');
    }

    return <Text style={styles}>{formattedText}</Text>;
  };

  return renderFormattedText();
};

const defaultStyles = StyleSheet.create({
  text: {
    color: '#fff',
    fontSize: 16,
  },
  bold: {
    fontWeight: 'bold',
  },
  italic: {
    fontStyle: 'italic',
  },
  underline: {
    textDecorationLine: 'underline',
  },
});

export default FormattedText; 