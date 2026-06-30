import sys
sys.path.append('.')
from services.execution_engine import execute_code
import json

code = """
#include <iostream>
#include <vector>
#include <string>

int main() {
    std::vector<int> my_vec = {1, 2, 3};
    std::string my_str = "hello";
    
    for (int x : my_vec) {
        std::cout << x << std::endl;
    }
    
    return 0;
}
"""

res = execute_code(code, "cpp")
print(json.dumps(res, indent=2))
