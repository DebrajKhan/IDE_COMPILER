export const CURRICULUM_DATA = {
  python: {
    Beginner: [
      {
        title: "Hello World & Variables",
        description: "Learn how to print and assign variables.",
        code: `message = "Hello, Python World!"\nprint(message)\n\nx = 10\ny = 5\nprint(f"x + y = {x + y}")`
      },
      {
        title: "Arrays (Lists)",
        description: "Initialize and access an array.",
        code: `arr = [10, 20, 30, 40]\nprint(arr)\nprint("First element:", arr[0])`
      }
    ],
    Intermediate: [
      {
        title: "For Loops & Array Traversal",
        description: "Iterate through an array.",
        code: `arr = [2, 4, 6, 8, 10]\nfor val in arr:\n    print(val)`
      },
      {
        title: "Functions",
        description: "Define a reusable function.",
        code: `def greet(name):\n    return f"Hello, {name}!"\n\nprint(greet("Alice"))`
      }
    ],
    Advanced: [
      {
        title: "List Comprehensions",
        description: "Create arrays elegantly.",
        code: `squares = [x*x for x in range(1, 6)]\nprint(squares)`
      },
      {
        title: "Classes & Objects",
        description: "Object-oriented programming basics.",
        code: `class Dog:\n    def __init__(self, name):\n        self.name = name\n    def bark(self):\n        print(f"{self.name} says Woof!")\n\nmy_dog = Dog("Rex")\nmy_dog.bark()`
      }
    ]
  },
  c: {
    Beginner: [
      {
        title: "Hello World",
        description: "Basic C program structure.",
        code: `#include <stdio.h>\n\nint main() {\n    printf("Hello, C World!\\n");\n    return 0;\n}`
      },
      {
        title: "Arrays",
        description: "Initialize a C array.",
        code: `#include <stdio.h>\n\nint main() {\n    int arr[5] = {1, 2, 3, 4, 5};\n    printf("arr[0] = %d\\n", arr[0]);\n    return 0;\n}`
      }
    ],
    Intermediate: [
      {
        title: "For Loops",
        description: "Iterate through an array.",
        code: `#include <stdio.h>\n\nint main() {\n    int arr[5] = {10, 20, 30, 40, 50};\n    for(int i = 0; i < 5; i++) {\n        printf("%d\\n", arr[i]);\n    }\n    return 0;\n}`
      },
      {
        title: "Pointers Basics",
        description: "Understand memory addresses.",
        code: `#include <stdio.h>\n\nint main() {\n    int val = 42;\n    int *ptr = &val;\n    printf("Value: %d\\n", val);\n    printf("Address: %p\\n", ptr);\n    printf("Dereferenced: %d\\n", *ptr);\n    return 0;\n}`
      }
    ],
    Advanced: [
      {
        title: "Dynamic Memory (malloc)",
        description: "Allocate arrays at runtime.",
        code: `#include <stdio.h>\n#include <stdlib.h>\n\nint main() {\n    int n = 5;\n    int *arr = (int*)malloc(n * sizeof(int));\n    for(int i = 0; i < n; i++) {\n        arr[i] = i * 2;\n        printf("%d ", arr[i]);\n    }\n    free(arr);\n    return 0;\n}`
      }
    ]
  },
  cpp: {
    Beginner: [
      {
        title: "Hello World",
        description: "Basic C++ program using iostream.",
        code: `#include <iostream>\n\nint main() {\n    std::cout << "Hello, C++ World!" << std::endl;\n    return 0;\n}`
      },
      {
        title: "Vectors",
        description: "Using the C++ Standard Template Library.",
        code: `#include <iostream>\n#include <vector>\n\nint main() {\n    std::vector<int> arr = {1, 2, 3, 4};\n    for(int i=0; i<arr.size(); i++) {\n        std::cout << arr[i] << " ";\n    }\n    return 0;\n}`
      }
    ],
    Intermediate: [
      {
        title: "Range-based For Loops",
        description: "Modern C++ array iteration.",
        code: `#include <iostream>\n#include <vector>\n\nint main() {\n    std::vector<int> arr = {10, 20, 30};\n    for(int val : arr) {\n        std::cout << val << " ";\n    }\n    return 0;\n}`
      },
      {
        title: "Classes",
        description: "OOP in C++.",
        code: `#include <iostream>\n#include <string>\n\nclass Cat {\npublic:\n    std::string name;\n    Cat(std::string n) : name(n) {}\n    void meow() {\n        std::cout << name << " says Meow!" << std::endl;\n    }\n};\n\nint main() {\n    Cat myCat("Whiskers");\n    myCat.meow();\n    return 0;\n}`
      }
    ],
    Advanced: [
      {
        title: "Templates",
        description: "Generic programming.",
        code: `#include <iostream>\n\ntemplate <typename T>\nT add(T a, T b) {\n    return a + b;\n}\n\nint main() {\n    std::cout << add(5, 3) << std::endl;\n    std::cout << add(2.5, 3.1) << std::endl;\n    return 0;\n}`
      }
    ]
  }
};
