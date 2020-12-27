#include <stdio.h>

void _print_string(char *s) {
  printf("%s", s);
}

void _print_ln() {
  printf("\n");
}

void _print_int(int v) {
  printf("%d", v);
}

void _print_bool(char v) {
  if (v == 1) printf("true"); else printf("false");
}

void _print_float(float v) {
  printf("%f", v);
}

