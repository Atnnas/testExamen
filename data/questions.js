import { kataQuestions } from './questions_kata';
import { kumiteQuestions } from './questions_kumite';
import { refereeQuestions } from './questions_referee';

export { kataQuestions, kumiteQuestions, refereeQuestions };
export const questions = [...kataQuestions, ...kumiteQuestions, ...refereeQuestions]; // fallback
