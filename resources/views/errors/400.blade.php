@extends('layouts.app')

@section('title', 'Permintaan Tidak Valid')
@section('meta_description', 'Permintaan tidak valid.')

@section('content')
    @include('errors.includes.layout', ['status' => '400'])
@endsection