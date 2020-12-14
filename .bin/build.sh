#!/bin/bash

deno run --allow-read --allow-write "https://raw.githubusercontent.com/littlelanguages/parspiler-cli/main/mod.ts" deno --verbose static/grammar.llgd

deno fmt static/grammar-*.ts
