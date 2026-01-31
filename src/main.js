/**
 * main.js — Entry point for the game.
 *
 * This file sets up the canvas to fill the entire browser window,
 * gets the 2D drawing context, and hands everything off to the game module.
 * Keeping this file thin makes it easy to see how the game starts.
 */
import { startGame } from './game.js'

// Select the <canvas> element from the HTML and size it to fill the whole window.
// The canvas is where all game graphics are drawn — it acts as the game screen.
const canvas = document.querySelector('canvas')
canvas.width = innerWidth
canvas.height = innerHeight

// The "2D context" is the drawing API that lets us render shapes, text, and images
// onto the canvas. Every draw call in the game goes through this object.
const context = canvas.getContext('2d')

startGame(canvas, context)
