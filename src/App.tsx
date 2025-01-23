import React, { useState, useEffect } from 'react';
import { SafeAreaView, StyleSheet, Button, View, FlatList, Text, TouchableOpacity } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import DrawingCanvas from './canvas/DrawingCanvas';

const App = () => {
  const [drawings, setDrawings] = useState<string[]>([]);
  const [selectedDrawing, setSelectedDrawing] = useState<string>('drawing1');

  useEffect(() => {
    loadDrawingsList();
  }, []);

  const loadDrawingsList = async () => {
    try {
      const savedDrawings = await AsyncStorage.getItem('drawings_list');
      if (savedDrawings) {
        setDrawings(JSON.parse(savedDrawings));
      }
    } catch (error) {
      console.error('Error loading drawings list:', error);
    }
  };

  const createNewDrawing = async () => {
    const newId = `drawing${drawings.length + 1}`;
    const updatedDrawings = [...drawings, newId];
    setDrawings(updatedDrawings);
    setSelectedDrawing(newId);
    await AsyncStorage.setItem('drawings_list', JSON.stringify(updatedDrawings));
  };

  return (
    <SafeAreaView style={styles.container}>
      <DrawingCanvas 
        style={styles.canvas} 
        drawingId={selectedDrawing}
        strokeColor="#000000" 
        strokeWidth={3} 
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    padding: 10,
  },
  canvas: {
    flex: 1,
  },
  drawingsList: {
    height: 50,
    backgroundColor: '#f0f0f0',
  },
  drawingItem: {
    padding: 10,
    marginHorizontal: 5,
    backgroundColor: '#e0e0e0',
    borderRadius: 5,
  },
  selectedDrawing: {
    backgroundColor: '#b0b0b0',
  },
});

export default App;