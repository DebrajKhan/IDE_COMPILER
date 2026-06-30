import sys
sys.path.append('.')
from services.execution_engine import execute_code
import json

code = """
#include <iostream>

struct MyStruct {
    int x;
    float y;
};

int main() {
    int my_prim = 42;
    int my_array[3] = {1, 2, 3};
    MyStruct my_struct = {10, 3.14f};
    int* my_ptr = &my_prim;
    
    std::cout << "Done!" << std::endl;
    return 0;
}
"""

res = execute_code(code, "cpp")
print(json.dumps(res, indent=2))
