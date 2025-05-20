/**
 * Task orchestration command for Claude Code MCP
 * 
 * This file adds task orchestration capabilities to the Local MCP Server.
 */

import { spawn } from 'node:child_process';
import { promises as fs } from 'node:fs';
import * as path from 'path';
import { fileURLToPath } from 'node:url';
import { dirname } from 'node:path';

// Create __dirname equivalent for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Project root directory
const projectRoot = path.resolve(__dirname, '..');

// Python executable in the virtual environment
const pythonPath = path.join(projectRoot, '.venv', 'bin', 'python');

/**
 * Execute a Python CLI command
 */
async function executePythonCommand(args: string[]): Promise<{ stdout: string, stderr: string }> {
  return new Promise((resolve, reject) => {
    const cmd = spawn(pythonPath, args, {
      cwd: projectRoot,
      env: { 
        ...process.env, 
        PYTHONPATH: projectRoot 
      }
    });

    let stdout = '';
    let stderr = '';

    cmd.stdout.on('data', (data) => {
      stdout += data.toString();
    });

    cmd.stderr.on('data', (data) => {
      stderr += data.toString();
    });

    cmd.on('close', (code) => {
      if (code === 0) {
        resolve({ stdout, stderr });
      } else {
        reject(new Error(`Command failed with code ${code}: ${stderr}`));
      }
    });

    cmd.on('error', (err) => {
      reject(err);
    });
  });
}

/**
 * Convert a markdown task to JSON
 */
export async function convertTaskMarkdown(params: { markdownPath: string, outputPath?: string }): Promise<any> {
  const { markdownPath, outputPath } = params;
  
  try {
    // Build the command arguments
    const args = ['-m', 'claude_code_mcp.cli', 'convert-task-markdown', markdownPath];
    if (outputPath) {
      args.push('--output-path', outputPath);
    }
    
    // Execute the command
    const result = await executePythonCommand(args);
    
    // Return the task data
    if (outputPath) {
      try {
        const taskData = JSON.parse(await fs.readFile(outputPath, 'utf8'));
        return {
          success: true,
          message: `Task converted successfully. JSON written to ${outputPath}`,
          task: taskData
        };
      } catch (error) {
        return {
          success: true,
          message: `Task converted successfully, but couldn't read the output file.`,
          stdout: result.stdout
        };
      }
    } else {
      return {
        success: true,
        message: 'Task converted successfully.',
        stdout: result.stdout
      };
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return {
      success: false,
      error: `Failed to convert task: ${message}`
    };
  }
}

/**
 * Execute a task with the task orchestration system
 */
export async function executeTask(params: { taskId: string }): Promise<any> {
  const { taskId } = params;
  
  try {
    // Build the command arguments
    const args = ['-m', 'claude_code_mcp.cli', 'execute-task', taskId];
    
    // Execute the command
    const result = await executePythonCommand(args);
    
    return {
      success: true,
      message: 'Task execution started.',
      stdout: result.stdout
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return {
      success: false,
      error: `Failed to execute task: ${message}`
    };
  }
}

/**
 * Check the status of a task
 */
export async function taskStatus(params: { taskId: string }): Promise<any> {
  const { taskId } = params;
  
  try {
    // Build the command arguments
    const args = ['-m', 'claude_code_mcp.cli', 'task-status', taskId];
    
    // Execute the command
    const result = await executePythonCommand(args);
    
    return {
      success: true,
      message: 'Task status retrieved.',
      stdout: result.stdout
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return {
      success: false,
      error: `Failed to get task status: ${message}`
    };
  }
}