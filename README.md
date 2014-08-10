SmileBankStatementToCSV
=======================

A simple script to scrape statement data from Smile Bank's online banking interface for manual exporting.

UPDATE: the old URL is broken as Github doesn't allow hotlinking scripts, so if the bookmarklet doesn't work any more just delete it and set it up again!

Get Bookmarklet on the project page: http://daaain.github.com/SmileBankStatementToCSV/

Just log in to Smile and once you're on a statement page (works for both current and older ones) click on the bookmarklet. If you're curious (or want to host this yourself) this is the bookmarklet code:

```
<a href="javascript:var%20d=document,z=d.createElement('scr'+'ipt'),b=d.body;try{if(!b)throw(0);z.setAttribute('src','https://rawgit.com/daaain/SmileBankStatementToCSV/master/savestatement.js');b.appendChild(z);}catch(e){alert('Please%20wait%20until%20the%20page%20has%20loaded.');}void(0)">Smile CSV</a>

```

In a few seconds after getting the statement data and converting to CSV it shows a jQuery Fancybox with the text preselected, so you only have to press ctrl + c / cmd + c and paste the exported data into your favourite texteditor.

Based on: http://simianstudios.com/blog/post/smile-csv-scraper-for-freeagent-and-xero but not depending on Flash and not freaking out Google Chrome by loading content from insecure (non-https) sources. There's a bit more on how to use it there though, so if my explanation didn't enlight you just click through!
