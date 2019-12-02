using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.Linq;
using System.Threading.Tasks;

namespace pi_lights.Helpers
{
    public static class ShellHelper
    {
        private static Process _process;
        private static bool _isRunning = false;
        public static string Bash(this string cmd)
        {
            if (_isRunning)
            {
                _process.Kill();
                _process.Dispose();
                _process = null;
            }
            var escapedArgs = cmd.Replace("\"", "\\\"");

            _process = new Process()
            {
                StartInfo = new ProcessStartInfo
                {
                    FileName = "/bin/bash",
                    Arguments = $"-c \"{escapedArgs}\"",
                    RedirectStandardOutput = true,
                    UseShellExecute = false,
                    CreateNoWindow = true,
                }
            };
            _process.Start();
            _isRunning = true;  
            string result = _process.StandardOutput.ReadToEnd();
            _process.WaitForExit();
            _isRunning = false;
            return result;
        }
    }
}
