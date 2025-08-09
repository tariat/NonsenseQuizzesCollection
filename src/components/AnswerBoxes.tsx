import React, { useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { gameColors } from '../constants/colors';

interface AnswerBoxesProps {
  answer: string;
  selectedChars: string[];
  onResetChar: (index: number) => void;
}

const AnswerBox = React.memo<{
  isSpace: boolean;
  userChar: string;
  onPress: () => void;
  style?: any;
}>(function AnswerBox({ isSpace, userChar, onPress, style }) {
  if (isSpace) {
    return <View style={styles.spaceGap} />;
  }

  return (
    <TouchableOpacity 
      style={[
        styles.answerBox,
        userChar ? styles.answerBoxFilled : styles.answerBoxEmpty,
        style
      ]}
      onPress={onPress}
    >
      <Text style={[
        styles.answerBoxText,
        !userChar && styles.answerBoxTextEmpty
      ]}>
        {userChar || ''}
      </Text>
    </TouchableOpacity>
  );
});

const AnswerBoxes = React.memo<AnswerBoxesProps>(function AnswerBoxes({ 
  answer, 
  selectedChars, 
  onResetChar 
}) {
  const boxes = useMemo(() => {
    const answerChars = answer.split('');
    let charIndex = 0;
    
    return answerChars.map((answerChar, index) => {
      if (answerChar === ' ') {
        return (
          <AnswerBox
            key={index}
            isSpace={true}
            userChar=""
            onPress={() => {}}
          />
        );
      } else {
        const currentCharIndex = charIndex;
        const userChar = selectedChars[currentCharIndex] || '';
        charIndex++;
        
        return (
          <AnswerBox
            key={index}
            isSpace={false}
            userChar={userChar}
            onPress={() => {
              if (userChar && currentCharIndex < selectedChars.length) {
                onResetChar(currentCharIndex);
              }
            }}
          />
        );
      }
    });
  }, [answer, selectedChars, onResetChar]);

  return (
    <View style={styles.answerPatternContainer}>
      {boxes}
    </View>
  );
});

const styles = StyleSheet.create({
  answerPatternContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
    minHeight: 50,
    backgroundColor: gameColors.cardBg,
    padding: 15,
    borderRadius: 15,
    borderWidth: 2,
    borderColor: gameColors.primary.solid,
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  answerBox: {
    width: 35,
    height: 35,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
  },
  answerBoxEmpty: {
    borderColor: gameColors.gray[300],
    borderStyle: 'dashed',
    backgroundColor: gameColors.gray[50],
  },
  answerBoxFilled: {
    borderColor: gameColors.primary.solid,
    borderStyle: 'solid',
    backgroundColor: gameColors.primary.solid,
  },
  answerBoxText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: gameColors.cardBg,
  },
  answerBoxTextEmpty: {
    color: gameColors.gray[400],
  },
  spaceGap: {
    width: 12,
    height: 35,
  },
});

export default AnswerBoxes;