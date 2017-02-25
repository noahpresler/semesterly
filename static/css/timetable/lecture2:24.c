/* Lecture on Casting 
*   between Types (numbers, pointers)
*  Friday Feb. 24th
*/
#include <stdio.h>
/*
INTEGERS
 	Right hand side is implicitly converted to the left
 	No loss of information
 	When left hand side is smaller than LHS and doesn't have enough
 		space to store things an implicit "modulo" operation is performed
FLOATS
	Floats and integers have same # of bits and only 24 of bits of int
		is used for the integer and stuff can get lost
CHARS
	Careful when going between usigned and signed chars, 
*/
int integer( void )
{
double d = 1.7;
float f = d;
printf( “%.8f -> %.8f\n” , d , f ); // 1.70000000 -> 1.70000000005
return 0;
}
/* 
Comparision
	Promote the lower ranked operand rather than the larger
		so that you don't lose info
	Can't go from char to unsigned char, must go to int first
	Int to double turned int to double and does operattion, then 
		answer put i back to int
*/
int unsignedInt( void )
{
	int i = -1;
	unsigned int ui = 1;
	if( i<ui ) printf( “hi\n” );
	else printf( “bye\n” );
	return 0; //prints bye bc int gets promoted to unsigned int
}
/*
Casting Pointers
	Address sizes: static < dynamic < local
	In memory, stack starts at top, heap at bottom and then meets
	Data is at bottom, heap starts after data segment and goes up
	Stak starts at hop and goes down
*/


