cmake_minimum_required(VERSION 3.0)
project(OverLaid)

set(CMAKE_CXX_STANDARD 17)

# Append CMake modules directory for finding libraries
set(CMAKE_MODULE_PATH ${CMAKE_MODULE_PATH} ${CMAKE_SOURCE_DIR}/cmake/)

# Locate packages
find_package(GLEW REQUIRED)
find_package(glfw3 3.3 REQUIRED)
find_package(OpenGL REQUIRED)
find_package(X11 REQUIRED)
find_package(nlohmann_json REQUIRED)

# Include library headers
include_directories(${GLEW_INCLUDE_DIRS} ${X11_INCLUDE_DIR} ${OPENGL_INCLUDE_DIR})

# Use GLEW OpenGL loader
add_definitions(-DIMGUI_IMPL_OPENGL_LOADER_GLEW)

# ImGui sources
set(IMGUI_PATH imgui)
file(GLOB IMGUI_SOURCES ${IMGUI_PATH}/*.cpp ${IMGUI_PATH}/backends/imgui_impl_glfw.cpp ${IMGUI_PATH}/backends/imgui_impl_opengl3.cpp)
add_library(imgui STATIC ${IMGUI_SOURCES})
target_include_directories(imgui PUBLIC ${IMGUI_PATH})

# Compile sources into executable
add_executable(OverLaid main.cpp)

# Link libraries
target_link_libraries(OverLaid imgui glfw ${OPENGL_LIBRARIES} ${GLEW_LIBRARIES} ${X11_LIBRARIES} ${CMAKE_DL_LIBS})
