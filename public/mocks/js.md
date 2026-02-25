## 01 Mental Models

**Read this code:**

```javascript
let a = 10;
let b = a;
a = 0;
```

What are the values of **a** and **b** after it runs? Work it out in your head before reading further.

If you’ve been writing JavaScript for a while, you might object: “This snippet is much simpler than the code I’m writing every day. What’s the point?”

The goal of this exercise isn’t to introduce you to variables. We assume you’re already familiar with them. Instead, it is to make you notice and reflect on your _mental model_.

### What’s a Mental Model?

Read the code above again with an intention to _really be sure_ what the result is. (We’ll see why this intention is important a bit later.)

While you’re reading it for the second time, pay close attention to what’s happening in your head, step by step. You might notice a monologue like this:

- `let a = 10;`
  - Declare a variable called **a**. Set it to **10**.
- `let b = a;`
  - Declare a variable called **b**. Set it to **a**.
  - Wait, what’s **a** again? Ah, it was **10**. So **b** is **10** too.
- `a = 0;`
  - Set the **a** variable to **0**.
- So **a** is **0** now, and **b** is **10**. That’s our answer.

Maybe your monologue is a bit different. Maybe you say “assign” instead of “set,” or maybe you read it in a slightly different order. Maybe you arrived at a different result. Pay attention to how exactly it was different. Note how even this monologue doesn’t capture what’s really happening in your head. You might say “set **b** to **a**,” but what does it even mean to _set_ a variable?

You might find that for every familiar fundamental programming concept (like a variable) and operations on it (like setting its value), there is a set of deep-rooted analogies that you associated with it. Some of them may come from the real world. Others may be repurposed from other fields you learned first, like numbers from math. These analogies might overlap and even contradict each other, but they still help you make sense of what’s happening in the code.

For example, many people first learned about variables as “boxes”—containers that hold your stuff. Even if you don’t vividly imagine boxes anymore when you see a variable, they might still behave “boxily” in your imagination.

These approximations of how something works in your head are known as “mental models.” It may be hard if you’ve been programming for a long time, but try to notice and introspect your mental models. They’re probably a combination of visual, spatial, and mechanical mental shortcuts. These intuitions (like “boxiness” of variables) influence how we read code our whole lives.

Unfortunately, sometimes our mental models are wrong. Maybe a tutorial we read early on sacrificed accuracy in order to make a concept easier to explain. Maybe, when we started learning JavaScript, we incorrectly “brought over” an expected behavior from a language we learned earlier. Maybe we inferred a mental model from some piece of code but never really verified it was accurate.

Identifying and fixing these problems is what _Just JavaScript_ is all about. We will gradually build (or possibly rebuild) your mental model of JavaScript to be accurate and useful. A good mental model will give you confidence in your own code, and it will let you understand (and fix) code that someone else wrote.

(By the way, **a** being **0** and **b** being **10** is the correct answer.)

### Coding, Fast and Slow

**“Thinking, Fast and Slow” is a book by Daniel Kahneman that explores the two different “systems” humans use when thinking.**

Whenever we can, we rely on the “fast” system, which is good at pattern matching and “gut reactions.” We share this system (which is necessary for survival!) with many animals, and it gives us amazing powers like the ability to walk without falling over. But it’s not good at planning.

Uniquely, thanks to the development of the frontal lobe, humans also possess a “slow” thinking system. This “slow” system is responsible for complex step-by-step reasoning. It lets us plan future events, engage in arguments, or follow mathematical proofs.

Because using the “slow” system is so mentally draining, we tend to default to the “fast” one—even when dealing with intellectual tasks like coding.

Imagine that you’re in the middle of a lot of work, and you want to quickly identify what this function does. Take a glance at it:

```javascript
function duplicateSpreadsheet(original) {
  if (original.hasPendingChanges) {
    throw new Error("You need to save the file before you can duplicate it.");
  }
  let copy = {
    created: Date.now(),
    author: original.author,
    cells: original.cells,
    metadata: original.metadata,
  };
  copy.metadata.title = "Copy of " + original.metadata.title;
  return copy;
}
```

You’ve probably noticed that:

- This function duplicates a spreadsheet.
- It throws an error if the original spreadsheet isn’t saved.
- It prepends “Copy of” to the new spreadsheet’s title.

What you might _not_ have noticed (great job if you did!) is that this function _also_ accidentally changes the title of the original spreadsheet. Missing bugs like this is something that happens to every programmer, every day.

Now that you know a bug exists, will you read the code differently? If you used the “fast” thinking system at first, you might switch to the more laborious “slow” system when you realize there’s a bug in the code.

When we use the “fast” system, we guess what the code does based on its overall structure, naming conventions and comments. Using the “slow” system, we retrace what the code does step by step—a tiring and time-consuming process.

This is why having an accurate mental model is so important. Simulating a computer in your head is hard, and when you have to fall back to the “slow” thinking system, your mental model is all you can rely on. With the wrong mental model, you’ll fundamentally misunderstand what to expect from your code, and all your effort will be wasted.

Don’t worry if you can’t find the bug at all—it just means you’ll get the most out of this course! Over the next modules, we’ll rebuild our mental model of JavaScript together, so that you can catch bugs like this immediately.

In the next module, we’ll start building mental models for some of the most fundamental JavaScript concepts—values and expressions.

---

## 02 The JavaScript Universe

**In the beginning was the Value.**

What is a value? It’s hard to say.

What is a point in geometry? What is a word in human language? A value is a fundamental concept in JavaScript—so we can’t define it through other terms.

Instead, we’ll define it through examples. Numbers and strings are values. Objects and functions are values, too.

There are also a lot of things that are _not_ values, like the pieces of our code—our `if` statements, loops, and variable declarations, for example.

### Values and Code

**As we start building our mental model, one of the first common misconceptions we need to clear up is that values are our code. Instead, we need to think of them separately—our code interacts with values, but values exist in a completely separate space.**

To distinguish between values and code in my JavaScript program, I like to imagine this drawing of the Little Prince by Antoine de Saint-Exupéry:

> [Image: The Little Prince]
> A drawing of the Little Prince standing on a small asteroid, looking at stars and planets in the distance.

I’m standing on a small planet, holding a list of instructions. This list is my program—my code. As I read through my list of instructions, I can see a lot going on—there are `if` statements, variable declarations, commas and curly braces.

My code contains instructions like “make a function call,” “do this thing many times,” or even “throw an error.” I read through these instructions step by step from the surface of my little world.

But every once in a while, I look up.

On a clear night, I see the different values in the JavaScript sky: booleans, numbers, strings, symbols, functions and objects, `null` and `undefined`—oh my! I might refer to them in my code, but they don’t exist _inside_ my code.

In our JavaScript universe, values float in space.

> [Image: The JavaScript Universe Diagram]
> A cosmic diagram with concentric orbits. The center is "My Code". The next ring contains "Objects & Functions" (represented by {}, [], and ()). The outermost ring contains "Primitive Values" (represented by strings like "muffin" and "banana", numbers like 12 and -9, booleans true and false, null, and undefined).

“Hold on,” you might say, “I always thought of values as being inside of my code!” Here, I’m asking you to take a leap of faith. It will take a few more modules for this mental model to pay off. Give it five minutes. I know what I’m doing.

### Values

**Broadly, there are two kinds of values.**

#### Primitive Values

Primitive values are like stars—cold and distant, but always there when I need them. Even from the surface of my small planet, I can find them and point them out. They can be numbers and strings, among other things. All primitive values have something in common: **They are a permanent part of our JavaScript universe. I can point to them, but I can’t create, destroy, or change them.**

To see primitive values in practice, open your browser’s console and log them:

```javascript
console.log(2);
console.log("hello");
console.log(undefined);
```

#### Objects and Functions

**Objects and functions are also values but, unlike primitive values, I can manipulate them from my code. If primitive values are like distant stars, then objects and functions are more like asteroids floating around my planet. They’re not part of my code, but they’re close enough to manipulate.**

> **Fun Fact**
> Functions are objects, but because they include a few unique additional features, we’re going to refer to them separately to avoid confusion.

Go ahead and log a few of them to the browser console:

```javascript
console.log({});
console.log([]);
console.log((x) => x * 2);
```

Notice how the browser console displays them differently from primitive values. Some browsers might display an arrow before them, or do something special when you click them. If you have a few different browsers installed, compare how they visualize objects and functions.

### Types of Values

**At first, all values in the JavaScript cosmos might look the same—just bright dots in the sky. But we are here to study all of the different things floating above us in our JavaScript universe, so we’ll need a way to categorize them.**

We can break values down into types—values of the same type behave in similar ways. As an aspiring astronomer, you might want to know about every type of value that can be observed in the JavaScript sky.

After almost twenty-five years of studying JavaScript, the scientists have only discovered nine such types:

#### Primitive Values

- **Undefined** (`undefined`), used for unintentionally missing values.
- **Null** (`null`), used for intentionally missing values.
- **Booleans** (`true` and `false`), used for logical operations.
- **Numbers** (`-100`, `3.14`, and others), used for math calculations.
- **BigInts** (uncommon and new), used for math on big numbers.
- **Strings** (`"hello"`, `"abracadabra"`, and others), used for text.
- **Symbols** (uncommon), used to perform rituals and hide secrets.

#### Objects and Functions

- **Objects** (`{}` and others), used to group related data and code.
- **Functions** (`x => x * 2` and others), used to refer to code.

#### No Other Types

You might ask: “But what about other types I have used, like arrays?”

**In JavaScript, there are no other fundamental value types other than the ones we have just enumerated. The rest are all objects! For example, even arrays, dates, and regular expressions fundamentally _are_ objects in JavaScript:**

```javascript
console.log(typeof []); // "object"
console.log(typeof new Date()); // "object"
console.log(typeof /(hello|goodbye)/); // "object"
```

> **Fun Fact**
> “I see,” you might reply, “this is because everything is an object!” Alas, this is a popular urban legend, but it’s not true.
>
> Although code like `"hi".toUpperCase()` makes `"hi"` seem like an object, this is nothing but an illusion. JavaScript creates a temporary object when you do this, and then immediately discards it. It’s fine if this mechanism doesn’t click for you yet. It is indeed rather confusing!
>
> For now, you only need to remember that primitive values, such as numbers and strings, are _not_ objects.

### Checking a Type

There are only nine types of values, but how do we know a particular value’s type?

If we want to check a value’s type, we can ask with the `typeof` operator. Below are a few examples you can try in the browser console:

```javascript
console.log(typeof 2); // "number"
console.log(typeof "hello"); // "string"
console.log(typeof undefined); // "undefined"
```

Strictly speaking, using parens isn’t required with `typeof`. For example, `typeof 2` would work just as fine as `typeof(2)`. However, sometimes parens are required to avoid an ambiguity. One of the cases below would break if we omitted the parens after `typeof`. Try to guess which one it is:

```javascript
console.log(typeof {}); // "object"
console.log(typeof []); // "object"
console.log(typeof ((x) => x * 2)); // "function"
```

You can verify your guess in the browser console.

### Expressions

**There are many questions JavaScript can’t answer. If you want to know whether it’s better to confess your true feelings to your best friend or to keep waiting until you both turn into skeletons, JavaScript won’t be of much help.**

But there are some questions that JavaScript would be _delighted_ to answer. These questions have a special name—they are called expressions.

If we “ask” the expression `2 + 2`, JavaScript will “answer” with the value `4`.

```javascript
console.log(2 + 2); // 4
```

For another example, remember how we determined the type of a value with `typeof`. In fact, that was also an expression! Our “question” was `typeof(2)` and the JavaScript universe answered it with the string value `"number"`.

```javascript
console.log(typeof 2); // "number"
```

**Expressions are questions that JavaScript can answer. JavaScript answers expressions in the only way it knows how—with values.**

If the word “expression” confuses you, think of it as a piece of code that _expresses_ a value. You might hear people say that `2 + 2` “results in” or “evaluates to” `4`. These are all different ways to say the same thing.

We ask JavaScript `2 + 2`, and it answers with `4`. **Expressions always result in a single value.** Now we know enough about expressions to be dangerous!

### Recap

Let’s recap what we know so far:

1. **There are values, and then there’s code.** We can think of values as different things “floating” in our JavaScript universe. They don’t exist _inside_ our code, but we can refer to them from our code.
2. **There are two categories of values: there are Primitive Values, and then there are Objects and Functions.** In total, there are nine separate types. Each type serves a specific purpose, but some are rarely used.
3. **Some values are lonely.** For example, `null` is the only value of the Null type, and `undefined` is the only value of the Undefined type. As we will learn later, these two lonely values are quite the troublemakers!
4. **We can ask questions with expressions.** Expressions exist in our code, so they are not values. Rather, JavaScript will _answer_ our expressions with values. For example, the `2 + 2` expression is answered with the value `4`.
5. **We can inspect the type of something by wrapping it in a `typeof` expression.** For example, `typeof(4)` results in the string value `"number"`.

---

## 03 Values and Variables

**We’ll kick off this module with a little code snippet.**

```javascript
let reaction = "yikes";
reaction[0] = "l";
console.log(reaction);
```

What do you expect this code to do? It’s okay if you’re not sure. Try to find the answer using your current knowledge of JavaScript.

I want you to take a few moments and write down your exact thought process for each line of this code, step by step. Pay attention to any gaps or uncertainties in your existing mental model and write them down, too. If you have any doubts, try to articulate them as clearly as you can.

> [Image: Answer Overlay]
> This code will either print "yikes" or throw an error depending on whether you are in strict mode. It will never print "likes".

### Primitive Values Are Immutable

Did you get the answer right? This might seem like the kind of trivia question that only comes up in JavaScript interviews. Even so, it illustrates an important point about primitive values.

**We can’t change primitive values.**

I will explain this with a small example. Strings (which are primitive) and arrays (which are not) have some superficial similarities. An array is a sequence of items, and a string is a sequence of characters:

```javascript
let arr = [212, 8, 506];
let str = "hello";
```

We can access the array’s first item and the string’s first character similarly. It almost feels like strings are arrays:

```javascript
console.log(arr[0]); // 212
console.log(str[0]); // "h"
```

But they’re not. Let’s take a closer look. We can change an array’s first item:

```javascript
arr[0] = 420;
console.log(arr); // [420, 8, 506]
```

Intuitively, it’s easy to assume that we can do the same to a string:

```javascript
str[0] = "j"; // ???
```

**But we can’t.**

It’s an important detail we need to add to our mental model. A string is a primitive value, and **all primitive values are immutable.** “Immutable” is a fancy Latin way to say “unchangeable.” Read-only. We can’t mess with primitive values. At all.

JavaScript won’t let us set a property on any primitive value, be it a number, string or something else. Whether it will silently refuse our request or throw an error depends on which mode our code is in. But rest assured that this will never work:

```javascript
let fifty = 50;
fifty.shades = "gray"; // No!
```

Like any number, `50` is a primitive value. We can’t set properties on it.

Remember that in our JavaScript universe, all primitive values are distant stars, floating farthest from our code. We can point to them, but they will always stay where they are, unchanged.

I find it strangely comforting.

### Variables and Values—A Contradiction?

You’ve seen that primitive values are read-only—or, in the parlance of our times, immutable. Now, use the following code snippet to test your mental model.

```javascript
let pet = "Narwhal";
pet = "The Kraken";
console.log(pet); // ?
```

Like before, write down your thought process in a few sentences. Don’t rush ahead. Pay close attention to how you’re thinking about each line, step by step. Does the immutability of strings play a role here? If it does, what role does it play?

> [Image: Answer Overlay]
> If you thought I was trying to mess with your head, you were right! The answer is "The Kraken". Immutability doesn’t play a role here.

### Variables Are Wires

**Let’s look at this example again.**

```javascript
let pet = "Narwhal";
pet = "The Kraken";
console.log(pet); // "The Kraken"
```

We know that string values can’t change because they are primitive. But the `pet` variable _does_ change to `"The Kraken"`. What’s up with that?

This might seem like it’s a contradiction, but it’s not. We said primitive _values_ can’t change, but we didn’t say anything about _variables_! As we refine our mental model, we need to untangle a couple of related concepts:

**Variables are not values.**
**Variables point to values.**

#### Assigning a Value to a Variable

In our JavaScript universe, a variable is a wire that _points to_ a value.

For example, I can point the `pet` variable to the `"Narwhal"` value. (I can also say that I’m _assigning_ the value `"Narwhal"` to the variable called `pet`):

```javascript
let pet = "Narwhal";
```

> [Image: Variable Assignment Diagram]
> A box labeled "pet" connected by a line (wire) to a circle containing "Narwhal".

But what if I want a different pet? No problem—I can point `pet` to another value:

```javascript
pet = "The Kraken";
```

All I am doing here is instructing JavaScript to point the variable, or a “wire”, on the left side (`pet`) to the value on the right side (`'The Kraken'`). It will keep pointing at that value unless I reassign it again later.

#### Rules of Assignment

There are two rules when we want to use the `=` assignment operator:

1. **The left side of an assignment must be a “wire”—such as the `pet` variable.** Note that the left side can’t be a value. (Try these examples in the console):
   ```javascript
   20000 = 'leagues under the sea'; // Nope.
   'war' = 'peace'; // Nope.
   ```
2. **The right side of an assignment must be an expression, so it always results in a value.** Our expression can be something simple, like `2` or `'hello'`. It can also be a more complicated expression—for example:
   ```javascript
   pet = count + " Dalmatians";
   ```
   Here, `count + ' Dalmatians'` is an expression—a question to JavaScript. JavaScript will answer it with a value (for example, `"101 Dalmatians"`). From now on, the `pet` variable “wire” will point to that particular value.

> **Fun Fact**
> If the right side must be an expression, does this mean that simple things—numbers like `2` or strings like `'The Kraken'`—written in code are also expressions? Yes! Such expressions are called literals—because we _literally_ write down the values that they result in.

#### Reading a Value of a Variable

I can also _read_ the value of a variable—for example, to log it:

```javascript
console.log(pet);
```

That’s hardly surprising.

But note that it is not the `pet` variable that we pass to `console.log`. We might say that colloquially, but we can’t really pass _variables_ to functions. We pass the current _value_ of the `pet` variable. How does this work?

It turns out that a variable name like `pet` can serve as an expression too! When we write `pet`, we’re asking JavaScript a question: “What is the current value of `pet`?” To answer our question, JavaScript follows `pet` “wire,” and gives us back the value at the end of this “wire.”

So the same expression can give us different values at different times!

### Nitpicking

**Who cares if you say “pass a variable” or “pass a value”? Isn’t the difference hopelessly pedantic? I certainly don’t encourage interrupting your colleagues to correct them. That would be a waste of everyone’s time.**

But you need to have clarity on _what you can do_ with each JavaScript concept in your head. You can’t skate a bike. You can’t fly an avocado. You can’t sing a mosquito. And you can’t pass a variable—at least not in JavaScript.

Here’s a small example of why these details matter.

```javascript
function double(x) {
  x = x * 2;
}
let money = 10;
double(money);
console.log(money); // ?
```

If we thought `double(money)` was passing a variable, we could expect that `x = x * 2` would double the `money` variable.

But that’s not right: `double(money)` means “figure out the _value_ of `money`, and then _pass that value_ to `double`.” So `money` still points to `10`. What a scam!

What are the different JavaScript concepts in your head? How do they relate to each other and how can we interact with them from code? Write down a short list of the ones you use most often.

### Putting it Together

**Now let’s revisit the first example from Mental Models:**

```javascript
let x = 10;
let y = x;
x = 0;
```

I suggest that you take a piece of paper or a drawing app and sketch out a diagram of what happens to the “wires” of the **x** and **y** variables step by step.

#### Step-by-Step Analysis

The first line doesn’t do much:

1. Declare a variable called **x**.
   - Draw the **x** variable wire.
2. Assign to **x** the value of **10**.
   - Point the **x** wire to the value **10**.

The second line is short, but it does quite a few things:

1. Declare a variable called **y**.
   - Draw the **y** variable wire.
2. Assign to **y** the value of **x**.
   - Evaluate the expression: **x**.
   - The “question” we want to answer is **x**.
   - **Follow the x wire—the answer is the value 10.**
   - The **x** expression resulted in the value **10**.
   - Therefore, assign to **y** the value of **10**.
   - **Point the y wire to the value 10.**

Finally, we get to the third line:

1. Assign to **x** the value of **0**.
   - **Point the x wire to the value 0.**

> [Image: Final Wires Diagram]
> Box "x" points to value 0. Box "y" points to value 10.

After these three lines of code have run, the **x** variable points to the value **0**, and the **y** variable points to the value **10**.

**Note that `y = x` did not mean point `y` to `x`. We can’t point variables to each other! Variables always point to values.** When we see an assignment, we “ask” the right side’s value, and point the “wire” on the left side to _that value_.

I mentioned in _Mental Models_ that it is common to think of variables as boxes. The universe we’re building is not going to have any boxes at all. **It only has wires!**

This might seem a bit annoying, but using wires makes it much easier to explain numerous other concepts, like strict equality, object identity, and mutation. We’re going to stick with wires, so you might as well start getting used to them now!

Our universe is full of wires.

### Recap

- **Primitive values are immutable.** They’re a permanent part of our JavaScript universe—we can’t create, destroy, or change them. For example, we can’t set a property on a string value because it is a primitive value. Arrays are not primitive, so we _can_ set their properties.
- **Variables are not values.** Each variable _points to_ a particular value. We can change _which_ value it points to by using the `=` assignment operator.
- **Variables are like wires.** A “wire” is not a JavaScript concept—but it helps us imagine how variables point to values. When we do an assignment, there’s always a wire on the left, and an expression (resulting in a value) on the right.
- **Look out for contradictions.** If two things that you learned seem to contradict each other, don’t get discouraged. Usually it’s a sign that there’s a deeper truth lurking underneath.
- **Language matters.** We’re building a mental model so that we can be confident in what _can_ or _cannot_ happen in our universe. We might speak about these ideas in a casual way (and nitpicking is often counterproductive) but our understanding of the meaning behind the terms needs to be precise.

---

## 04 Studying from the Inside

**In the next module, we’ll take a closer look at our JavaScript universe and the values in it. But before we can get to that, we need to address the elephant in the room. Is our JavaScript universe even real?**

### The JavaScript Simulation

I live on my small planet inside our JavaScript universe.

When I ask our universe a question, it answers with a value. I certainly didn’t come up with all these values myself. The variables, the expressions, the values—they populate our world. The JavaScript world around me is absolutely real to me.

But sometimes, there is a moment of silence before the next line of code; a brief pause before the next function call. During those moments, I see visions of a world that’s much bigger than our JavaScript universe.

In these visions, there are no variables and values; no expressions and no literals. Instead, there are quarks. There are atoms and electrons.
