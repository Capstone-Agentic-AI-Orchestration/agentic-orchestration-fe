"use client";

import { useMemo, type ReactNode } from "react";

/**
 * Lightweight syntax highlighting for code artifacts.
 * Uses regex-based tokenization — no external dependencies.
 * Supports TypeScript/JavaScript, CSS, Prisma, SQL, Markdown, JSON.
 */

interface CodeBlockProps {
  code: string;
  language?: string;
  maxHeight?: number;
  showLineNumbers?: boolean;
  className?: string;
}

const KEYWORDS_TS = new Set([
  "import", "export", "from", "const", "let", "var", "function", "return", "if", "else",
  "for", "while", "switch", "case", "break", "continue", "new", "class", "extends",
  "implements", "interface", "type", "enum", "async", "await", "try", "catch", "throw",
  "typeof", "instanceof", "in", "of", "as", "default", "void", "null", "undefined",
  "true", "false", "this", "super", "static", "readonly", "public", "private", "protected",
  "abstract", "override", "satisfies", "keyof", "infer",
]);

const KEYWORDS_SQL = new Set([
  "SELECT", "FROM", "WHERE", "INSERT", "INTO", "VALUES", "UPDATE", "SET", "DELETE",
  "CREATE", "ALTER", "DROP", "TABLE", "INDEX", "VIEW", "JOIN", "LEFT", "RIGHT", "INNER",
  "OUTER", "ON", "AND", "OR", "NOT", "NULL", "IS", "IN", "LIKE", "BETWEEN", "EXISTS",
  "GROUP", "BY", "ORDER", "ASC", "DESC", "LIMIT", "OFFSET", "UNION", "ALL", "DISTINCT",
  "AS", "WITH", "CASCADE", "RESTRICT", "DEFAULT", "PRIMARY", "KEY", "FOREIGN", "REFERENCES",
  "UNIQUE", "CHECK", "CONSTRAINT", "ADD", "COLUMN", "IF", "EXISTS", "BEGIN", "END",
  "COMMIT", "ROLLBACK", "TRANSACTION", "RETURNING", "CONFLICT", "DO", "NOTHING",
]);

const KEYWORDS_PRISMA = new Set([
  "model", "enum", "type", "generator", "datasource", "provider", "url", "relation",
  "fields", "references", "onDelete", "onUpdate", "default", "unique", "id", "map",
  "@@map", "@@index", "@@unique", "@@id", "@default", "@unique", "@relation", "@map",
  "@id", "@updatedAt", "@ignore",
]);

function tokenize(code: string, language: string): ReactNode[] {
  const lines = code.split("\n");
  const lang = language.toLowerCase();
  const isSql = lang === "sql";
  const isPrisma = lang === "prisma";
  const isTs = !isSql && !isPrisma;

  return lines.map((line, lineIdx) => {
    const tokens: ReactNode[] = [];
    let i = 0;

    while (i < line.length) {
      // Comments
      if (line[i] === "/" && line[i + 1] === "/") {
        tokens.push(<span key={`${lineIdx}-${i}`} className="cx-comment">{line.slice(i)}</span>);
        break;
      }
      if (line.slice(i, i + 2) === "--") {
        tokens.push(<span key={`${lineIdx}-${i}`} className="cx-comment">{line.slice(i)}</span>);
        break;
      }
      if (line[i] === "#") {
        tokens.push(<span key={`${lineIdx}-${i}`} className="cx-comment">{line.slice(i)}</span>);
        break;
      }

      // Strings
      if (line[i] === "'" || line[i] === '"' || line[i] === "`") {
        const quote = line[i];
        let end = i + 1;
        while (end < line.length && line[end] !== quote) {
          if (line[end] === "\\") end++;
          end++;
        }
        end = Math.min(end + 1, line.length);
        tokens.push(<span key={`${lineIdx}-${i}`} className="cx-string">{line.slice(i, end)}</span>);
        i = end;
        continue;
      }

      // Numbers
      if (/\d/.test(line[i])) {
        let end = i;
        while (end < line.length && /[\d._]/.test(line[end])) end++;
        tokens.push(<span key={`${lineIdx}-${i}`} className="cx-number">{line.slice(i, end)}</span>);
        i = end;
        continue;
      }

      // Decorators
      if (line[i] === "@") {
        let end = i + 1;
        while (end < line.length && /[\w@]/.test(line[end])) end++;
        tokens.push(<span key={`${lineIdx}-${i}`} className="cx-decorator">{line.slice(i, end)}</span>);
        i = end;
        continue;
      }

      // Words (keywords, identifiers)
      if (/[a-zA-Z_$]/.test(line[i])) {
        let end = i;
        while (end < line.length && /[\w$]/.test(line[end])) end++;
        const word = line.slice(i, end);
        const upperWord = word.toUpperCase();

        if (isSql && KEYWORDS_SQL.has(upperWord)) {
          tokens.push(<span key={`${lineIdx}-${i}`} className="cx-keyword">{word}</span>);
        } else if (isPrisma && (KEYWORDS_PRISMA.has(word) || KEYWORDS_PRISMA.has(`@${word}`))) {
          tokens.push(<span key={`${lineIdx}-${i}`} className="cx-keyword">{word}</span>);
        } else if (isTs && KEYWORDS_TS.has(word)) {
          tokens.push(<span key={`${lineIdx}-${i}`} className="cx-keyword">{word}</span>);
        } else if (/^[A-Z]/.test(word)) {
          tokens.push(<span key={`${lineIdx}-${i}`} className="cx-type">{word}</span>);
        } else {
          tokens.push(<span key={`${lineIdx}-${i}`}>{word}</span>);
        }
        i = end;
        continue;
      }

      // Punctuation / operators
      tokens.push(<span key={`${lineIdx}-${i}`} className="cx-punct">{line[i]}</span>);
      i++;
    }

    return (
      <div key={lineIdx} className="cx-line">
        <span className="cx-line-num">{lineIdx + 1}</span>
        <span className="cx-line-content">{tokens}</span>
      </div>
    );
  });
}

export function CodeBlock({
  code,
  language = "typescript",
  maxHeight = 400,
  showLineNumbers = true,
  className = "",
}: CodeBlockProps) {
  const highlighted = useMemo(() => tokenize(code, language), [code, language]);

  return (
    <div
      className={`code-block ${className}`}
      style={{ maxHeight }}
    >
      <div className="code-block-header">
        <span className="code-block-lang mono">{language}</span>
        <span className="code-block-lines mono">{code.split("\n").length} lines</span>
      </div>
      <pre className={`code-block-pre ${showLineNumbers ? "has-line-nums" : ""}`}>
        <code>{highlighted}</code>
      </pre>
    </div>
  );
}
