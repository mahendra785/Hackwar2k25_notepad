import type React from "react";
import {
  View,
  Modal,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Linking,
} from "react-native";
import Katex from "react-native-katex";

interface LatexModalProps {
  visible: boolean;
  onClose: () => void;
  content: string;
  theme: {
    background: string;
    surface: string;
    text: string;
    primary: string;
  };
  title: string;
}

const LatexModal: React.FC<LatexModalProps> = ({
  visible,
  onClose,
  content,
  theme,
  title,
}) => {
  const formatContent = (text: string) => {
    return text.split("\n").map((line, index) => {
      // Handle LaTeX expressions
      if (line.trim().startsWith("$$") && line.trim().endsWith("$$")) {
        return (
          <Katex
            key={index}
            expression={line.trim().replace(/\$\$/g, "")}
            style={{ color: theme.text, marginVertical: 10 }}
            displayMode={true}
          />
        );
      }

      // Handle Markdown headings
      if (line.startsWith("#")) {
        const headingLevel = line.match(/^#+/)[0].length; // Count the number of `#`
        const fontSize = 24 - (headingLevel - 1) * 2; // Adjust font size based on heading level
        return (
          <Text
            key={index}
            style={[
              styles.plainText,
              {
                fontSize,
                fontWeight: "bold",
                color: theme.text,
                marginVertical: 8,
              },
            ]}
          >
            {line.replace(/^#+\s*/, "")} {/* Remove the `#` and whitespace */}
          </Text>
        );
      }

      // Handle bold text **text**
      if (/\*\*(.*?)\*\*/.test(line)) {
        return (
          <Text key={index} style={[styles.plainText, { color: theme.text }]}>
            {line.split(/(\*\*.*?\*\*)/).map((part, partIndex) =>
              /\*\*(.*?)\*\*/.test(part) ? (
                <Text key={partIndex} style={{ fontWeight: "bold" }}>
                  {part.replace(/\*\*/g, "")}
                </Text>
              ) : (
                part
              )
            )}
          </Text>
        );
      }

      // Handle italic text *text*
      if (/\*(.*?)\*/.test(line)) {
        return (
          <Text key={index} style={[styles.plainText, { color: theme.text }]}>
            {line.split(/(\*.*?\*)/).map((part, partIndex) =>
              /\*(.*?)\*/.test(part) ? (
                <Text key={partIndex} style={{ fontStyle: "italic" }}>
                  {part.replace(/\*/g, "")}
                </Text>
              ) : (
                part
              )
            )}
          </Text>
        );
      }

      // Handle bullet points
      if (line.trim().startsWith("- ") || line.trim().startsWith("* ")) {
        return (
          <View key={index} style={{ flexDirection: "row", marginVertical: 5 }}>
            <Text style={{ color: theme.text }}>• </Text>
            <Text style={{ color: theme.text }}>{line.trim().slice(2)}</Text>
          </View>
        );
      }

      // Handle links [title](url)
      const linkRegex = /\[(.*?)\]\((.*?)\)/;
      if (linkRegex.test(line)) {
        const matches = line.match(linkRegex);
        const title = matches?.[1] || "";
        const url = matches?.[2] || "";
        return (
          <TouchableOpacity
            key={index}
            onPress={() => Linking.openURL(url)}
            style={{ marginVertical: 5 }}
          >
            <Text
              style={[
                styles.plainText,
                { color: theme.primary, textDecorationLine: "underline" },
              ]}
            >
              {title}
            </Text>
          </TouchableOpacity>
        );
      }

      // Handle inline code `code`
      if (/`.*?`/.test(line)) {
        return (
          <Text key={index} style={[styles.plainText, { color: theme.text }]}>
            {line.split(/(`.*?`)/).map((part, partIndex) =>
              /`.*?`/.test(part) ? (
                <Text
                  key={partIndex}
                  style={{
                    fontFamily: "monospace",
                    backgroundColor: theme.surface,
                    borderRadius: 4,
                    paddingHorizontal: 4,
                    color: theme.primary,
                  }}
                >
                  {part.replace(/`/g, "")}
                </Text>
              ) : (
                part
              )
            )}
          </Text>
        );
      }

      // Handle code blocks ```code```
      if (line.startsWith("```") && line.endsWith("```")) {
        return (
          <Text
            key={index}
            style={{
              fontFamily: "monospace",
              backgroundColor: theme.surface,
              borderRadius: 4,
              padding: 10,
              color: theme.primary,
              marginVertical: 10,
            }}
          >
            {line.replace(/```/g, "")}
          </Text>
        );
      }

      // Regular text
      return (
        <Text
          key={index}
          style={[styles.plainText, { color: theme.text, marginVertical: 5 }]}
        >
          {line}
        </Text>
      );
    });
  };

  return (
    <Modal
      transparent
      visible={visible}
      onRequestClose={onClose}
      animationType="fade"
    >
      <View
        style={[styles.modalOverlay, { backgroundColor: "rgba(0,0,0,0.5)" }]}
      >
        <View style={[styles.modalContent, { backgroundColor: theme.surface }]}>
          <Text style={[styles.modalTitle, { color: theme.text }]}>
            {title}
          </Text>
          <ScrollView style={styles.contentContainer}>
            {formatContent(content)}
          </ScrollView>
          <TouchableOpacity
            style={[styles.closeButton, { backgroundColor: theme.primary }]}
            onPress={onClose}
          >
            <Text style={styles.closeButtonText}>Close</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    padding: 20,
    borderRadius: 16,
    width: "90%",
    maxWidth: 400,
    maxHeight: "80%",
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 20,
    textAlign: "center",
  },
  contentContainer: {
    marginBottom: 20,
  },
  plainText: {
    fontSize: 16,
    lineHeight: 24,
  },
  closeButton: {
    padding: 14,
    borderRadius: 12,
  },
  closeButtonText: {
    color: "white",
    textAlign: "center",
    fontWeight: "600",
    fontSize: 16,
  },
});

export default LatexModal;
