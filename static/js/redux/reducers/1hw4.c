Last login: Wed Mar  8 16:28:15 on ttys002


 76             printf("%s", token);
 77             for(unsigned int i = 0; i < strlen(token)-1; i++) {
 78                 if(userInput[i] != 'a' && userInput[i] != 'A'
 79                 && userInput[i] != 'C' && userInput[i] != 'c'
 80                 && userInput[i] != 'G' && userInput[i] != 'g'
 81                 && userInput[i] != 'T' && userInput[i] != 't') {
 82                     printf("Invalid pattern");
 83                     return 1;
 84                 }
 85             }
 86             pointer = findMatch(input, token);
 87             //printf("in main with pointer\n");
 88             printcounter = 0;
 89             int tokenLen = strlen(token);
 90             printf("%.*s",tokenLen, token);
 91             while(pointer[printcounter] != '\0') {
 92                 printf("%d ", pointer[printcounter]);
 93                 printcounter++;
 94             }
 95             token = strtok(NULL, space);
 96         }
 97     }
 98     FILE *outputFile = fopen("courseInts.txt", "w");
 99     //Checks that correctly can open file
"hw4.c" 107L, 2431C                                           87,4-13       90%
 70     char *token;
 71     int *pointer;
 72     int printcounter;
 73     while(fgets(userInput, LENGTH, stdin) != NULL) {
 74         token = strtok(userInput, space);
 75         while(token != NULL) {
 76             printf("%s", token);
 77             for(unsigned int i = 0; i < strlen(token)-1; i++) {
 78                 if(userInput[i] != 'a' && userInput[i] != 'A'
 79                 && userInput[i] != 'C' && userInput[i] != 'c'
 80                 && userInput[i] != 'G' && userInput[i] != 'g'
 81                 && userInput[i] != 'T' && userInput[i] != 't') {
 82                     printf("Invalid pattern");
 83                     return 1;
 84                 }
 85             }
 86             pointer = findMatch(input, token);
 87             //printf("in main with pointer\n");
 88             printcounter = 0;
 89             int tokenLen = strlen(token);
 90             printf("%.*s",tokenLen, token);
 91             while(pointer[printcounter] != '\0') {
 92                 printf("%d ", pointer[printcounter]);
 93                 printcounter++;
 94             }
 95             token = strtok(NULL, space);
 96         }
 97     }
 98     FILE *outputFile = fopen("courseInts.txt", "w");
 99     //Checks that correctly can open file
100     if (outputFile == NULL) {
101         printf("Could not create output file.\n");
102         return 1;
103     }
104     fclose(outputFile);
105     return 0;
106 }
107
                                                                        87,4-13       Bot
 69     char space[2] = " ";
 70     char *token;
 71     int *pointer;
 72     int printcounter;
 73     while(fgets(userInput, LENGTH, stdin) != NULL) {
 74         token = strtok(userInput, space);
 75         while(token != NULL) {
 76             printf("%s", token);
 77             for(unsigned int i = 0; i < strlen(token)-1; i++) {
 78                 if(userInput[i] != 'a' && userInput[i] != 'A'
 79                 && userInput[i] != 'C' && userInput[i] != 'c'
 80                 && userInput[i] != 'G' && userInput[i] != 'g'
 81                 && userInput[i] != 'T' && userInput[i] != 't') {
 82                     printf("Invalid pattern");
 83                     return 1;
 84                 }
 85             }
 86             pointer = findMatch(input, token);
 87             //printf("in main with pointer\n");
 88             printcounter = 0;
 89             int tokenLen = strlen(token);
 90             printf("%.*s",tokenLen, token);
 91             while(pointer[printcounter] != '\0') {
 92                 printf("%d ", pointer[printcounter]);
 93                 printcounter++;
 94             }
 95             token = strtok(NULL, space);
 96         }
 97     }
 98     FILE *outputFile = fopen("courseInts.txt", "w");
 99     //Checks that correctly can open file
100     if (outputFile == NULL) {
101         printf("Could not create output file.\n");
102         return 1;
103     }
104     fclose(outputFile);
105     return 0;
106 }
107
:wq