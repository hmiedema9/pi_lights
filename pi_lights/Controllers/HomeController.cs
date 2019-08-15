using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using pi_lights.Models;
using pi_lights.Helpers;

namespace pi_lights.Controllers
{
    public class HomeController : Controller
    {
        public IActionResult Index()
        {
            return View();
        }

        public IActionResult Midi()
        {
            return View();
        }

        public IActionResult Privacy()
        {
            return View();
        }

        [ResponseCache(Duration = 0, Location = ResponseCacheLocation.None, NoStore = true)]
        public IActionResult Error()
        {
            return View(new ErrorViewModel { RequestId = Activity.Current?.Id ?? HttpContext.TraceIdentifier });
        }

        
        public ActionResult LightUp()
        {
            string command = Constants.PYTHON_BASE + "strandtest.py";
            string result = ShellHelper.Bash(command);
            return Json(new { Message = result});
        }

        public ActionResult LightPaint()
        {
            string command = Constants.PYTHON_BASE + "lightpaint.py";
            string result = ShellHelper.Bash(command);
            return Json(new { Message = result });
        }
    }
}
