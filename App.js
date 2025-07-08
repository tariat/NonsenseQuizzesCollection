import React, { useState } from 'react';
import { View, Text, TextInput, Button, TouchableOpacity, FlatList, StyleSheet } from 'react-native';

const initialQuestions = [
  { id: 1, question: '네모에서 온 동물은?', answer: '정답 예시' },
  { id: 2, question: '달리는 가수가 싫어하는 나라?', answer: '천천국' },
];

const fillerWords = ['사과', '바나나', '고양이', '강아지', '자동차'];

export default function App() {
  const [screen, setScreen] = useState('menu');
  const [questions, setQuestions] = useState(initialQuestions);
  const [search, setSearch] = useState('');
  const [quizIndex, setQuizIndex] = useState(0);
  const [selectedWords, setSelectedWords] = useState([]);
  const [feedback, setFeedback] = useState([]);
  const [score, setScore] = useState(0);
  const [name, setName] = useState('');
  const [scoreboard, setScoreboard] = useState([]);
  const [pending, setPending] = useState([]);

  const currentQuestion = questions[quizIndex];

  const startQuiz = () => {
    setScore(0);
    setFeedback([]);
    setQuizIndex(0);
    setScreen('play');
  };

  const shuffle = (arr) => arr.sort(() => Math.random() - 0.5);

  const handleWordPress = (word) => {
    const next = [...selectedWords, word];
    setSelectedWords(next);
    if (next.join(' ') === currentQuestion.answer) {
      setScore(score + 1);
      setScreen('feedback');
    } else if (next.length >= currentQuestion.answer.split(' ').length) {
      setScreen('feedback');
    }
  };

  const submitFeedback = (choice) => {
    setFeedback([...feedback, { questionId: currentQuestion.id, choice }]);
    setSelectedWords([]);
    if (quizIndex + 1 < questions.length) {
      setQuizIndex(quizIndex + 1);
      setScreen('play');
    } else {
      setScreen('enterName');
    }
  };

  const submitName = () => {
    setScoreboard([...scoreboard, { name, score }]);
    setName('');
    setScreen('scoreboard');
  };

  const registerQuiz = (q, a) => {
    setPending([...pending, { question: q, answer: a }]);
  };

  if (screen === 'menu') {
    return (
      <View style={styles.container}>
        <Button title="퀴즈 모음 검색" onPress={() => setScreen('search')} />
        <Button title="퀴즈 맞추기" onPress={startQuiz} />
        <Button title="퀴즈 등록" onPress={() => setScreen('register')} />
      </View>
    );
  }

  if (screen === 'search') {
    const results = questions.filter(q => q.question.includes(search));
    return (
      <View style={styles.container}>
        <TextInput placeholder="검색" value={search} onChangeText={setSearch} style={styles.input} />
        <FlatList
          data={results}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item }) => (
            <View style={styles.item}><Text>{item.question}</Text></View>
          )}
        />
        <Button title="뒤로" onPress={() => setScreen('menu')} />
      </View>
    );
  }

  if (screen === 'play') {
    const answerWords = currentQuestion.answer.split(' ');
    const options = shuffle([...answerWords, ...shuffle(fillerWords).slice(0, 4)]);
    return (
      <View style={styles.container}>
        <Text style={styles.question}>{currentQuestion.question}</Text>
        <View style={styles.grid}>
          {options.map((w, idx) => (
            <TouchableOpacity key={idx} style={styles.word} onPress={() => handleWordPress(w)}>
              <Text>{w}</Text>
            </TouchableOpacity>
          ))}
        </View>
        <Text>선택: {selectedWords.join(' ')}</Text>
      </View>
    );
  }

  if (screen === 'feedback') {
    return (
      <View style={styles.container}>
        <Text>{`정답은: ${currentQuestion.answer}`}</Text>
        <Button title="좋아요" onPress={() => submitFeedback('like')} />
        <Button title="싫어요" onPress={() => submitFeedback('dislike')} />
        <Button title="패스" onPress={() => submitFeedback('pass')} />
      </View>
    );
  }

  if (screen === 'enterName') {
    return (
      <View style={styles.container}>
        <Text>{`점수: ${score}`}</Text>
        <TextInput placeholder="이름" value={name} onChangeText={setName} style={styles.input} />
        <Button title="확인" onPress={submitName} />
      </View>
    );
  }

  if (screen === 'scoreboard') {
    return (
      <View style={styles.container}>
        <FlatList
          data={scoreboard}
          keyExtractor={(_, idx) => idx.toString()}
          renderItem={({ item }) => (
            <View style={styles.item}><Text>{`${item.name}: ${item.score}`}</Text></View>
          )}
        />
        <Button title="메뉴" onPress={() => setScreen('menu')} />
      </View>
    );
  }

  if (screen === 'register') {
    const [q, setQ] = useState('');
    const [a, setA] = useState('');
    return (
      <View style={styles.container}>
        <TextInput placeholder="문제" value={q} onChangeText={setQ} style={styles.input} />
        <TextInput placeholder="답" value={a} onChangeText={setA} style={styles.input} />
        <Button title="등록" onPress={() => { registerQuiz(q, a); setQ(''); setA(''); }} />
        <Button title="뒤로" onPress={() => setScreen('menu')} />
      </View>
    );
  }

  return null;
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: 20 },
  input: { borderWidth: 1, padding: 10, marginVertical: 10 },
  item: { padding: 10 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', marginVertical: 20 },
  word: { padding: 10, borderWidth: 1, margin: 5 },
  question: { fontSize: 18, marginBottom: 20 },
});
