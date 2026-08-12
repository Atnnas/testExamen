import { kataQuestions } from './questions_kata';
import { kumiteQuestions } from './questions_kumite';

export { kataQuestions, kumiteQuestions };
export const questions = [...kataQuestions, ...kumiteQuestions]; // fallback
